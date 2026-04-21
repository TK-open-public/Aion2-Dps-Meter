package com.tbread.data

import com.tbread.data.repository.*
import com.tbread.entity.*
import kotlinx.serialization.json.*
import org.slf4j.LoggerFactory
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedDeque
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicLong

object DataManager {
    private val logger = LoggerFactory.getLogger(DataManager::class.java)

    private val resetEpoch = AtomicLong(0)

    fun currentEpoch(): Long = resetEpoch.get()

    /*
    rawPacket 버퍼 영역
     */
    private val rawPacketBuffer = ConcurrentLinkedDeque<RawPacket>()

    fun saveRawPacket(data: ByteArray, timestamp: Long) {
        rawPacketBuffer.add(RawPacket(data, timestamp))
    }

    fun rawPacketsInRange(from: Long, to: Long): List<RawPacket> {
        return rawPacketBuffer.filter { it.timestamp in from..to }
    }

    private val mobIdRepository = MobIdRepository()
    private val mobRepository = MobRepository()
    private val userRepository = UserRepository()
    private val packetRepository = PacketRepository()
    private val summonRepository = SummonRepository()
    private val battleLogRepository = BattleLogRepository()
    private val skillRepository = SkillRepository()
    private val mobHpRepository = MobHpRepository()
    private val useBuffRepository = UseBuffRepository()
    private val buffRepository = BuffRepository()

    private val buffBlacklist = mutableSetOf<Int>()

    fun isBuffBlacklisted(code: Int): Boolean = code in buffBlacklist

    fun load() {
        loadMobJson()
        loadSkillJson()
        loadBuffJson()
        loadCustomBuffJson()
        loadBuffBlacklistJson()
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

    private fun loadBuffJson() {
        try {
            val buffJson = object {}.javaClass.getResourceAsStream("/json/buff.json")
                ?.bufferedReader()
                ?.readText()!!

            val json = Json { ignoreUnknownKeys = true }

            json.decodeFromString<JsonObject>(buffJson).forEach { (code, element) ->
                val obj = element.jsonObject
                val buff = obj["effect"]?.jsonPrimitive?.contentOrNull?.let {
                    obj["summary"]?.jsonPrimitive?.contentOrNull?.let { it1 ->
                        Buff(
                            code = code.toInt(),
                            name = obj["name"]?.jsonPrimitive?.content ?: "",
                            summary = it1,
                            effect = it
                        )
                    }
                }
                buff?.let { saveBuff(it) }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun loadBuffBlacklistJson() {
        try {
            val json = object {}.javaClass.getResourceAsStream("/json/buff_blacklist.json")
                ?.bufferedReader()?.readText() ?: return
            Json.decodeFromString<JsonObject>(json)["blacklist"]
                ?.jsonArray
                ?.forEach { buffBlacklist.add(it.jsonPrimitive.int) }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun loadCustomBuffJson() {
        try {
            val buffJson = object {}.javaClass.getResourceAsStream("/json/buff_custom.json")
                ?.bufferedReader()
                ?.readText()!!

            val json = Json { ignoreUnknownKeys = true }

            json.decodeFromString<JsonObject>(buffJson).forEach { (code, element) ->
                val obj = element.jsonObject
                val buff = obj["effect"]?.jsonPrimitive?.contentOrNull?.let {
                    obj["summary"]?.jsonPrimitive?.contentOrNull?.let { it1 ->
                        Buff(
                            code = code.toInt(),
                            name = obj["name"]?.jsonPrimitive?.content ?: "",
                            summary = it1,
                            effect = it
                        )
                    }
                }
                buff?.let { saveBuff(it) }
            }
        } catch (e: Exception) {
            e.printStackTrace()
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
        rawPacketBuffer.clear()
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

    @Volatile
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

    private val recentlyEndedMobs = ConcurrentHashMap<Int, Long>()
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
    fun saveBattleLog(data: DpsReport) {
        val snapshot = data.copy(
            contributors = data.contributors.mapTo(mutableSetOf()) { it.copy() }
        )
        val packets = rawPacketsInRange(data.battleStart - 5000L, data.battleEnd)
        battleLogRepository.save(DpsLog(snapshot, summonRepository.getAll(), packets))
        rawPacketBuffer.removeIf { it.timestamp <= data.battleEnd }
    }

    fun recentBattleList(): List<Pair<Int, DpsReport>> {
        val battleList: MutableList<Pair<Int, DpsReport>> = mutableListOf()
        val battleLogs = battleLogRepository.getAll()
        battleLogs.forEachIndexed { idx, it ->
            battleList.add(Pair(idx, it.report))
        }
        return battleList
    }

    fun battleLog(idx: Int): DpsLog? {
        return battleLogRepository.get(idx)
    }


    /*
    summon 영역
     */
    fun summonerId(summonId: Int): Int? {
        return summonRepository.get(summonId)
    }

    fun summonMap(): Map<Int, Int> = summonRepository.getAll()

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

    fun saveUser(user: User) {
        userRepository.savePending(user)
    }

    fun findUserByNicknameAndServer(nickname: String, server: Int): User? {
        return userRepository.findByNicknameAndServer(nickname, server)
    }

    fun saveNickname(uid: Int, nickname: String, isExecutor: Boolean = false,server:Int) {
        val user = userRepository.get(uid) ?: User(uid, nickname, server, null, isExecutor).also {
            userRepository.save(uid, it)
        }
        user.nickname = nickname
        if (isExecutor) {
            saveExecutorId(uid)
        }
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

    /*
    buff 영역
     */
    fun saveUseBuff(uid: Int, useBuff: UseBuff) {
        useBuffRepository.save(uid, useBuff)
    }

    fun battleBuff(uid:Int,start:Long,end:Long): List<UseBuff> {
        return useBuffRepository.findOverlapping(uid,start,end)
    }

    fun buff(buffCode:Int):Buff?{
        return buffRepository.get(buffCode)
    }

    private fun saveBuff(buff: Buff){
        buffRepository.save(buff)
    }
}