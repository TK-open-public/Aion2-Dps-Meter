package com.tbread

import com.tbread.data.DataManager
import com.tbread.entity.*
import com.tbread.entity.enums.JobClass
import com.tbread.entity.enums.SpecialDamage
import org.slf4j.LoggerFactory
import java.util.concurrent.CopyOnWriteArrayList

class DpsCalculator() {
    private val logger = LoggerFactory.getLogger(DpsCalculator::class.java)

    private var currentTarget: Int = 0

    private var recentData = DpsReport()

    private fun battleData(): CopyOnWriteArrayList<ParsedDamagePacket>? {
        return DataManager.battleData(currentTarget)
    }


    fun getDps(): DpsReport {
        val data = battleData()
        val storageTarget = DataManager.currentTarget()
        if (storageTarget != currentTarget) {
            DataManager.saveBattleLog(recentData)
        }
        currentTarget = storageTarget
        if (currentTarget == -1) {
            DataManager.flushPacket()
            recentData.battleEnd = DataManager.currentBattleEnd()
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
            //남은체력 여기서 불러오기
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

        recentData = report
        return report
    }

    fun battleDetails(data: DpsReport?, uid: Int): HashMap<String, AnalyzedSkill> {
        val analyzedData: HashMap<String, AnalyzedSkill> = hashMapOf()
        if (data == null){
            return analyzedData
        }
        data.packets?.forEach {
            val skillName = DataManager.skill(it.getSkillCode1().toLong()) ?: it.getSkillCode1().toString()
            if (it.getActorId() == uid) {
                if (!analyzedData.containsKey(skillName)) {
                    val analyzedSkill = AnalyzedSkill(it)
                    analyzedData[skillName] = analyzedSkill
                }
                val analyzedSkill = analyzedData[skillName]!!
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

    fun resetDataStorage() {
        if (!recentData.isEmpty()) {
            DataManager.saveBattleLog(recentData)
        }
        DataManager.flushPacket()
        currentTarget = -1
        logger.info("대상 데미지 누적 데이터 초기화 완료")
    }

}