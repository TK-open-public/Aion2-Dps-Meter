package com.tbread.data

import com.tbread.data.repository.*
import com.tbread.entity.Mob
import com.tbread.entity.ParsedDamagePacket
import com.tbread.entity.User
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.util.concurrent.CopyOnWriteArrayList

object DataManager {
    private val logger = LoggerFactory.getLogger(DataManager::class.java)

    private val mobIdRepository = MobIdRepository()
    private val mobRepository = MobRepository()
    private val userRepository = UserRepository()
    private val packetRepository = PacketRepository()
    private val summonRepository = SummonRepository()
    private val battleLogRepository = BattleLogRepository()

    fun load() {
        val mobJson = object {}.javaClass.getResourceAsStream("/json/mobs.json")
            ?.bufferedReader()
            ?.readText()!!
        Json.decodeFromString<List<Mob>>(mobJson).forEach { saveMob(it) }
    }


    /*
    복합 영역
     */
    @Synchronized
    fun saveDamage(pdp: ParsedDamagePacket) {
        packetRepository.save(pdp)
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

    fun toggleBattle(mobId: Int) {
        val pastTarget = currentTarget()
        if (pastTarget == mobId) {
            saveCurrentBattleEnd()
            saveCurrentTarget(-1)
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

    private fun saveCurrentBattleEnd() {
        packetRepository.saveCurrentBattleEnd()
    }

    private fun saveCurrentTarget(targetId: Int) {
        packetRepository.currentTarget(targetId)
    }

    @Synchronized
    fun flushPacket() {
        packetRepository.flush()
    }


    /*
    battleLog 영역
     */
    fun saveBattleLog(data: CopyOnWriteArrayList<ParsedDamagePacket>) {
        battleLogRepository.save(data)
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

    fun saveUser(uid:Int,user: User){
        userRepository.save(uid,user)
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
        }
    }
}