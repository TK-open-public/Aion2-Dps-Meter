package com.tbread.data

import com.tbread.data.repository.*
import com.tbread.entity.*
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicLong

object DataManager {
    private val logger = LoggerFactory.getLogger(DataManager::class.java)

    private val resetEpoch = AtomicLong(0)

    fun currentEpoch(): Long = resetEpoch.get()

    private val mobIdRepository = MobIdRepository()
    private val mobRepository = MobRepository()
    private val userRepository = UserRepository()
    private val packetRepository = PacketRepository()
    private val summonRepository = SummonRepository()
    private val battleLogRepository = BattleLogRepository()
    private val skillRepository = SkillRepository()
    private val mobHpRepository = MobHpRepository()

    fun load() {
        loadMobJson()
        loadSkillJson()
    }

    private fun loadMobJson() {
        val mobJson = object {}.javaClass.getResourceAsStream("/json/mobs.json")
            ?.bufferedReader()
            ?.readText()!!
        Json.decodeFromString<List<Mob>>(mobJson).forEach { saveMob(it) }
    }

    private fun loadSkillJson() {
        val skillJson = object {}.javaClass.getResourceAsStream("/json/skills.json")
            ?.bufferedReader()
            ?.readText()!!
        Json.decodeFromString<List<Skill>>(skillJson).forEach {
            saveSkill(it)
        }
    }

    @Synchronized
    fun hardReset() {
        resetEpoch.incrementAndGet()
        battleLogRepository.flush()
        mobHpRepository.flush()
        mobIdRepository.flush()
        packetRepository.flush()
        summonRepository.flush()
        userRepository.flush()
        lastDummyHitTime = 0
        recentlyEndedMobs.clear()
    }

    /*
    mobHp 영역
     */

    fun mobHp(mobId: Int): Int? {
        return mobHpRepository.get(mobId)
    }

    fun mobHp(mobId: Int, mobHp: Int) {
        mobHpRepository.set(mobId, mobHp)
    }

    /*
    skill 영역
     */
    private fun saveSkill(skill: Skill) {
        return skillRepository.save(skill.code, skill)
    }

    fun skill(skillId: Long): Skill? {
        return skillRepository.get(skillId)
    }


    /*
    packet 영역
     */
    fun battleData(targetId: Int): CopyOnWriteArrayList<ParsedDamagePacket>? {
        if (packetRepository.currentTarget() == 0) {
            return CopyOnWriteArrayList(packetRepository.getAll().values.flatten().filter {
                !existMobId(it.getTargetId())
            })
        }
        return packetRepository.get(targetId)
    }

    fun currentTarget(): Int {
        return packetRepository.currentTarget()
    }

    fun isCurrentTargetDummy(): Boolean {
        val current = currentTarget()
        if (current <= 0) return false
        return mobId(current)?.let { mob(it) }?.isDummy == true
    }

    fun executorId(): Int = userRepository.executor()

    private var lastDummyHitTime: Long = 0
    private val DUMMY_TIMEOUT_MS = 5000L

    fun touchDummyBattle(mobId: Int, epoch: Long) {
        if (resetEpoch.get() != epoch) return
        lastDummyHitTime = System.currentTimeMillis()
        if (currentTarget() <= 0) {
            saveCurrentBattleStart()
            saveCurrentTarget(mobId)
        }
    }

    fun checkDummyTimeout() {
        val current = currentTarget()
        if (current <= 0) return
        if (!isCurrentTargetDummy()) return
        if (System.currentTimeMillis() - lastDummyHitTime > DUMMY_TIMEOUT_MS) {
            saveCurrentBattleEnd(lastDummyHitTime)
            saveCurrentTarget(-1)
            lastDummyHitTime = 0
        }
    }

    private val recentlyEndedMobs = HashMap<Int, Long>()
    private val BATTLE_END_COOLDOWN_MS = 1000L

    fun toggleBattle(mobId: Int) {
        val pastTarget = currentTarget()
        if (pastTarget == mobId) {
            saveCurrentBattleEnd()
            saveCurrentTarget(-1)
            recentlyEndedMobs[mobId] = System.currentTimeMillis()
            return
        }
        val recentEnd = recentlyEndedMobs[mobId]
        if (recentEnd != null && System.currentTimeMillis() - recentEnd < BATTLE_END_COOLDOWN_MS) {
            return
        }
        saveCurrentBattleStart()
        saveCurrentTarget(mobId)
    }

    fun currentBattleStart(): Long {
        return packetRepository.currentBattleStart()
    }

    fun currentBattleEnd(): Long {
        return packetRepository.currentBattleEnd()
    }

    private fun saveCurrentBattleStart() {
        packetRepository.saveCurrentBattleStart()
    }

    private fun saveCurrentBattleEnd(time: Long = System.currentTimeMillis()) {
        packetRepository.saveCurrentBattleEnd(time)
    }

    private fun saveCurrentTarget(targetId: Int) {
        packetRepository.currentTarget(targetId)
    }

    @Synchronized
    fun flushPacket() {
        packetRepository.flush()
        packetRepository.currentTarget(-1)
        packetRepository.flushBattleTime()
        lastDummyHitTime = 0
    }

    @Synchronized
    fun saveDamage(pdp: ParsedDamagePacket, epoch: Long) {
        if (resetEpoch.get() != epoch) return
        packetRepository.save(pdp)
    }


    /*
    battleLog 영역
     */
    fun saveBattleLog(data: DpsReport,packets:List<ParsedDamagePacket>?=null) {
        battleLogRepository.save(DpsLog(data, summonRepository.getAll(),packets))
    }

    fun recentBattleList(): List<Pair<Int, DpsReport>> {
        val battleList: MutableList<Pair<Int, DpsReport>> = mutableListOf()
        val battleLogs = battleLogRepository.getAll()
        battleLogs.forEachIndexed { idx, it ->
            battleList.add(Pair(idx, it.report))
        }
        return battleList
    }

    fun battleLog(idx: Int): DpsReport? {
        return battleLogRepository.get(idx)?.report
    }


    /*
    summon 영역
     */
    fun summonerId(summonId: Int): Int? {
        return summonRepository.get(summonId)
    }

    fun saveSummon(summonId: Int, summonerId: Int) {
        summonRepository.save(summonId, summonerId)
    }


    /*
    mobId 영역
     */
    fun mobId(mobId: Int): Int? {
        return mobIdRepository.get(mobId)
    }

    fun saveMobId(mid: Int, code: Int) {
        mobIdRepository.save(mid, code)
    }

    private fun existMobId(mobId: Int): Boolean {
        return mobIdRepository.exist(mobId)
    }


    /*
    mob 영역
     */
    fun mob(mobCode: Int): Mob? {
        return mobRepository.get(mobCode)
    }

    private fun saveMob(mob: Mob) {
        mobRepository.save(mob.code, mob)
    }


    /*
    user 영역
     */
    fun user(uid: Int): User? {
        return userRepository.get(uid)
    }

    fun saveUser(uid: Int, user: User) {
        userRepository.save(uid, user)
    }

    fun saveNickname(uid: Int, nickname: String, isExecutor: Boolean = false) {
        if (!userRepository.exist(uid)) {
            userRepository.save(uid, User(uid, nickname, -1, null, isExecutor))
        }
        if (userRepository.get(uid)!!.equals(nickname)) return
        userRepository.get(uid)!!.nickname = nickname
        if (isExecutor) {
            saveExecutorId(uid)
        }
    }

    fun saveServer(uid: Int, server: Int) {
        userRepository.get(uid)!!.server = server
    }

    private fun saveExecutorId(uid: Int) {
        val executor = userRepository.executor()
        if (executor != uid) {
            if (executor != 0) {
                userRepository.get(executor)!!.isExecutor = false
            }
            userRepository.executor(uid)
            userRepository.get(uid)!!.isExecutor = true
        }
    }
}