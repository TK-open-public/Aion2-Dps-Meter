package com.tbread

import com.tbread.entity.Mob
import com.tbread.entity.ParsedDamagePacket
import com.tbread.entity.User
import org.slf4j.LoggerFactory
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

class DataStorage {
    private val logger = LoggerFactory.getLogger(DataStorage::class.java)
    private val packetStorage = ConcurrentHashMap<Int, CopyOnWriteArrayList<ParsedDamagePacket>>()
    private val userStorage = ConcurrentHashMap<Int, User>()
    private val summonStorage = HashMap<Int, Int>()
    private val skillCodeData = HashMap<Int, String>()
    private val mobCodeData = HashMap<Int, Mob>()
    private val mobStorage = HashMap<Int, Int>()
    private var currentTarget: Int = 0
    private var nowExecutor: Int = 0

    @Synchronized
    fun appendDamage(pdp: ParsedDamagePacket) {
        packetStorage.computeIfAbsent(pdp.getTargetId()) { CopyOnWriteArrayList() }
            .add(pdp)
        if (mobCodeData[mobStorage[pdp.getTargetId()]]?.boss == true) {
            setCurrentTarget(pdp.getTargetId())
        }
    }

    fun getBattleData(targetId: Int): CopyOnWriteArrayList<ParsedDamagePacket>? {
        return packetStorage[targetId]
    }

    private fun setCurrentTarget(targetId: Int) {
        currentTarget = targetId
    }

    fun currentTarget(): Int {
        return currentTarget
    }

    fun appendMobCode(mob: Mob) {
        mobCodeData[mob.code] = mob
    }

    fun appendMob(mid: Int, code: Int) {
        mobStorage[mid] = code
    }

    fun appendSummon(summoner: Int, summon: Int) {
        summonStorage[summon] = summoner
    }

    @Synchronized
    fun flushDamageStorage() {
        packetStorage.clear()
        summonStorage.clear()
        logger.info("데미지 패킷 초기화됨")
    }

    fun getSkillName(skillCode: Int): String {
        return skillCodeData[skillCode] ?: skillCode.toString()
    }

    fun getSummonData(): HashMap<Int, Int> {
        return summonStorage
    }

    fun getMobCodeData(): HashMap<Int, Mob> {
        return mobCodeData
    }

    fun getMobData(): HashMap<Int, Int> {
        return mobStorage
    }

    /*
    user 영역
     */
    fun appendNickname(uid: Int, nickname: String, isExecutor: Boolean = false) {
        if (!userStorage.containsKey(uid)) {
            userStorage[uid] = User(uid, nickname, -1, null, isExecutor)
        }
        if (userStorage[uid]!!.equals(nickname)) return
        userStorage[uid]!!.nickname = nickname
        if (isExecutor) {
            changeExecutorId(uid)
        }
    }

    private fun changeExecutorId(uid: Int) {
        if (nowExecutor != 0) {
            userStorage[nowExecutor]!!.isExecutor = false
        }
        nowExecutor = uid
    }

    fun user(uid: Int): User? {
        return userStorage[uid]
    }
}