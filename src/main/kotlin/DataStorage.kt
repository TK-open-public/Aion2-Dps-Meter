package com.tbread

import com.tbread.entity.Mob
import com.tbread.entity.ParsedDamagePacket
import org.slf4j.LoggerFactory
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentSkipListSet
import java.util.concurrent.CopyOnWriteArrayList

class DataStorage {
    private val logger = LoggerFactory.getLogger(DataStorage::class.java)
    private val packetStorage = ConcurrentHashMap<Int, CopyOnWriteArrayList<ParsedDamagePacket>>()
    private val nicknameStorage = ConcurrentHashMap<Int, String>()
    private val summonStorage = HashMap<Int, Int>()
    private val skillCodeData = HashMap<Int, String>()
    private val mobCodeData = HashMap<Int, Mob>()
    private val mobStorage = HashMap<Int, Int>()
    private var currentTarget:Int = 0
    private var executorCode:Int = 0

    @Synchronized
    fun appendDamage(pdp: ParsedDamagePacket) {
        packetStorage.computeIfAbsent(pdp.getTargetId()) { CopyOnWriteArrayList() }
            .add(pdp)
        if (mobCodeData[mobStorage[pdp.getTargetId()]]?.boss == true){
            setCurrentTarget(pdp.getTargetId())
        }
    }

    fun getBattleData(targetId:Int):CopyOnWriteArrayList<ParsedDamagePacket>?{
        return packetStorage[targetId]
    }

    fun setExecutorCode(executorCode:Int) {
        this.executorCode = executorCode
    }

    private fun setCurrentTarget(targetId:Int){
        currentTarget = targetId
    }

    fun currentTarget():Int{
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

    fun appendNickname(uid: Int, nickname: String) {
        if (nicknameStorage[uid] != null && nicknameStorage[uid].equals(nickname)) return
        logger.debug("닉네임 등록 {} -> {}",nicknameStorage[uid],nickname)
        nicknameStorage[uid] = nickname
    }

    @Synchronized
    fun flushDamageStorage() {
        packetStorage.clear()
        summonStorage.clear()
        logger.info("데미지 패킷 초기화됨")
    }

    private fun flushNicknameStorage() {
        nicknameStorage.clear()
    }

    fun getSkillName(skillCode: Int): String {
        return skillCodeData[skillCode] ?: skillCode.toString()
    }

    fun getNickname(): ConcurrentHashMap<Int, String> {
        return nicknameStorage
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
}