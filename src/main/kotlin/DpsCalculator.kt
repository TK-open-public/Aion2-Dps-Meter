package com.tbread

import com.tbread.data.DataManager
import com.tbread.entity.*
import com.tbread.entity.enums.JobClass
import com.tbread.entity.enums.SpecialDamage
import org.slf4j.LoggerFactory
import java.util.concurrent.CopyOnWriteArrayList

class DpsCalculator(private val streamResetCallback: (() -> Unit)? = null) {
    private val logger = LoggerFactory.getLogger(DpsCalculator::class.java)

    private var currentTarget: Int = 0
    private var recentTargetWasDummy: Boolean = false

    private var recentData = DpsReport()
    private var recentDataSaved = false

    private fun battleData(): CopyOnWriteArrayList<ParsedDamagePacket>? {
        return DataManager.battleData(currentTarget)
    }

    fun getRecentData(): DpsReport {
        return recentData
    }

    fun getLiveReport(): DpsReport {
        val storageTarget = DataManager.currentTarget()
        if (storageTarget == -1) return recentData
        return DpsReport(
            battleStart = DataManager.currentBattleStart(),
            battleEnd = DataManager.currentBattleEnd(),
            packets = DataManager.battleData(storageTarget)
        )
    }


    fun getDps(): DpsReport {
        val storageTarget = DataManager.currentTarget()
        val data = DataManager.battleData(storageTarget)
        val prevTargetDummy = DataManager.isCurrentTargetDummy()
        val isNewBattleEnd = storageTarget == -1 && storageTarget != currentTarget
        if (storageTarget != currentTarget && !prevTargetDummy
            && storageTarget != -1 && currentTarget != -1
        ) {
            DataManager.saveBattleLog(recentData)
            recentDataSaved = true
        }
        currentTarget = storageTarget
        recentTargetWasDummy = prevTargetDummy
        if (currentTarget == -1) {
            val battleEnd = DataManager.currentBattleEnd()
            DataManager.flushPacket()
            if (isNewBattleEnd) {
                recentData.battleEnd = battleEnd
            }
            if (isNewBattleEnd && !recentData.isEmpty() && !recentTargetWasDummy) {
                DataManager.saveBattleLog(recentData)
                recentDataSaved = true
            }
            return recentData
        }
        val report =
            DpsReport(
                battleStart = DataManager.currentBattleStart(),
                battleEnd = DataManager.currentBattleEnd(),
                packets = data
            )
        if (currentTarget > 0) {
            val mobCode = DataManager.mobId(currentTarget)
            val mob = DataManager.mob(mobCode!!)
            report.target = MobInfo(currentTarget, mob!!)
            report.target!!.remainHp = DataManager.mobHp(currentTarget)?:0
        }
        data?.forEach {
            val actor = DataManager.summonerId(it.getActorId()) ?: it.getActorId()
            val user = DataManager.user(actor) ?: User(actor, nickname = actor.toString())
            report.contributors.remove(user)
            report.contributors.add(user)
            if (user.job == null) {
                user.job = JobClass.convertFromSkill(it.getSkillCode1())
            }
            DataManager.saveUser(user.id, user)
            report.information.getOrPut(user.id) { DpsInformation() }.addDamage(it.getDamage().toDouble())
            report.compareBattleTime(it.getTimeStamp())
        }
        report.information.forEach { (_, info) ->
            val totalDamage = report.information.values.sumOf { it.amount }
            if (report.battleEnd - report.battleStart != 0L) {
                info.dps = info.amount / (report.battleEnd - report.battleStart) * 1000
            }
            if (totalDamage != 0.0) {
                info.contribution = info.amount / totalDamage * 100
            }
        }

        // 허수아비 전투 시 executor가 참가하지 않았으면 표기 안 함 (executor 미확인 시 그대로 표기)
        if (DataManager.isCurrentTargetDummy()) {
            val executorId = DataManager.executorId()
            if (executorId != 0 && !report.contributors.any { it.isExecutor }) {
                return recentData
            }
        }

        recentData = report
        recentDataSaved = false
        return report
    }

    fun battleDetails(data: DpsReport?, uid: Int): HashMap<String, AnalyzedSkill> {
        val analyzedData: HashMap<String, AnalyzedSkill> = hashMapOf()
        if (data == null) {
            return analyzedData
        }
        data.packets?.forEach {
            val skill = DataManager.skill(it.getSkillCode1().toLong())
            val skillName = skill?.name ?: it.getSkillCode1().toString()
            val realActor = DataManager.summonerId(it.getActorId()) ?: it.getActorId()
            if (realActor == uid) {
                if (!analyzedData.containsKey(skillName)) {
                    val analyzedSkill = AnalyzedSkill(it)
                    analyzedData[skillName] = analyzedSkill
                }
                val analyzedSkill = analyzedData[skillName]!!
                analyzedSkill.img = skill?.img
                if (it.isDoT()) {
                    analyzedSkill.dotTimes++
                    analyzedSkill.dotDamageAmount += it.getDamage()
                } else {
                    analyzedSkill.times++
                    analyzedSkill.damageAmount += it.getDamage()
                    if (it.isCrit()) analyzedSkill.critTimes++
                    if (it.getSpecials().contains(SpecialDamage.BACK)) analyzedSkill.backTimes++
                    if (it.getSpecials().contains(SpecialDamage.PARRY)) analyzedSkill.parryTimes++
                    if (it.getSpecials().contains(SpecialDamage.DOUBLE)) analyzedSkill.doubleTimes++
                    if (it.getSpecials().contains(SpecialDamage.PERFECT)) analyzedSkill.perfectTimes++
                }
            }
        }
        return analyzedData
    }

    fun getBuffOperatingRate(uid: Int, start: Long, end: Long): Map<String, Double> {
        val totalDuration = end - start
        if (totalDuration <= 0) return emptyMap()

        return DataManager.battleBuff(uid, start, end)
            .groupBy { it.skillCode }
            .mapKeys { (skillCode, _) -> DataManager.buff(skillCode)?.name ?: skillCode.toString() }
            .mapValues { (_, buffs) ->
                val clamped = buffs
                    .map { maxOf(it.buffStart, start) to minOf(it.buffEnd, end) }
                    .sortedBy { it.first }

                val merged = mutableListOf<Pair<Long, Long>>()
                for (interval in clamped) {
                    if (merged.isEmpty() || interval.first > merged.last().second) {
                        merged.add(interval)
                    } else {
                        val last = merged.removeLast()
                        merged.add(last.first to maxOf(last.second, interval.second))
                    }
                }

                merged.sumOf { it.second - it.first }.toDouble() / totalDuration * 100.0
            }
    }

    fun resetDataStorage() {
        if (!recentData.isEmpty() && !recentDataSaved && !DataManager.isCurrentTargetDummy()) {
            DataManager.saveBattleLog(recentData)
            recentDataSaved = true
        }
        DataManager.flushPacket()
        currentTarget = -1
        recentData = DpsReport()
        recentDataSaved = false
        logger.info("대상 데미지 누적 데이터 초기화 완료")
    }

    fun hardReset() {
        DataManager.hardReset()
        streamResetCallback?.invoke()
        currentTarget = -1
        recentData = DpsReport()
        recentDataSaved = false
        logger.info("전체 강제 초기화 완료")
    }

}