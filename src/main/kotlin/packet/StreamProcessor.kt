package com.tbread.packet

import com.tbread.data.DataManager
import com.tbread.entity.ParsedDamagePacket
import com.tbread.entity.enums.SpecialDamage
import net.jpountz.lz4.LZ4Factory
import org.slf4j.LoggerFactory
import java.nio.ByteBuffer
import java.nio.ByteOrder

class StreamProcessor() {
    private val logger = LoggerFactory.getLogger(StreamProcessor::class.java)

    data class VarIntOutput(val value: Int, val length: Int)

    private val mask = 0x0f

    private val decompressFactory = LZ4Factory.fastestInstance()
    private val decompressor = decompressFactory.fastDecompressor()

    fun onPacketReceived(packet: ByteArray, arrivedAt: Long) {
        if (packet.size == 3) return

        DataManager.saveRawPacket(packet, arrivedAt)

        val epoch = DataManager.currentEpoch()


        val lengthInfo = readVarInt(packet)
        val extraFlag = (packet[lengthInfo.length] >= 0xf0.toByte() && packet[lengthInfo.length] < 0xff.toByte())
        if (extraFlag) {
            if (packet[lengthInfo.length + 1] == 0xff.toByte() && packet[lengthInfo.length + 2] == 0xff.toByte()) {
                decompressPacket(packet, lengthInfo.length, true, epoch, arrivedAt)
                return
            }
        } else {
            if (packet[lengthInfo.length] == 0xff.toByte() && packet[lengthInfo.length + 1] == 0xff.toByte()) {
                decompressPacket(packet, lengthInfo.length, false, epoch, arrivedAt)
                return
            }
        }
        parseJoinRequestPacket(packet,lengthInfo,extraFlag)
        searchOwnNickname(packet, lengthInfo)
        searchOtherNickname(packet, lengthInfo)
        var flag = false
        flag = parseBattlePacket(packet, lengthInfo, extraFlag)
        if (flag) return
        flag = parsingDamage(packet, extraFlag, epoch, arrivedAt)
        if (flag) return
        flag = parseSummonPacket(packet, extraFlag)
        if (flag) return
        flag = parseDoTPacket(packet, extraFlag, epoch, arrivedAt)
        if (flag) return
        flag = parseRemainHp(packet,lengthInfo,extraFlag)
        if (flag) return
    }

    private fun decompressPacket(packet: ByteArray, headerLength: Int, extraFlag: Boolean, epoch: Long, arrivedAt: Long) {
        try {
            var offset = headerLength + 2
            if (extraFlag) {
                offset += 1
            }
            val originLength = parseUInt32le(packet, offset)
            offset += 4
            val restored = ByteArray(originLength)
            decompressor.decompress(packet, offset, restored, 0, originLength)

            var innerOffset = 0
            while (innerOffset < restored.size) {
                val pastInnerOffset = innerOffset
                val lengthInfo = readVarInt(restored, innerOffset)
                if (lengthInfo.value == 0) {
                    innerOffset += 1
                    continue
                }

                val realLength = lengthInfo.value + lengthInfo.length - 4
                if (realLength <= 0) {
                    logger.error("패킷 길이 체크에서 오류발생 {}, 오프셋 {}", toHex(packet), innerOffset)
                    break
                }

                onPacketReceived(restored.copyOfRange(pastInnerOffset, pastInnerOffset + realLength), arrivedAt)
                innerOffset += realLength
            }
        } catch (e: Exception) {
            logger.error("패킷 압축 해제중 에러", e)
        }
        logger.trace("압축 패킷 해제 종료")
    }

    private fun searchOwnNickname(packet: ByteArray, lengthInfo: VarIntOutput) {
        var offset = lengthInfo.length
        if (packet[offset] != 0x33.toByte()) return
        if (packet[offset + 1] != 0x36.toByte()) return


        offset += 2
        if (packet.size < offset) return

        val userInfo = readVarInt(packet, offset)
        if (userInfo.length < 0) return

        offset += userInfo.length
        if (offset >= packet.size) return

        if (packet.size < offset + 10) return
        val spliterIdx = findArrayIndex(packet.copyOfRange(offset, offset + 10), 0x07)
        if (spliterIdx == -1) return
        offset += spliterIdx + 1

        val nameLengthInfo = readVarInt(packet, offset)
        offset += nameLengthInfo.length
        if (nameLengthInfo.length > 71) return
        if (offset >= packet.size) return

        var server = -1
        var job = -1
        val np = packet.copyOfRange(offset, offset + nameLengthInfo.value)
        val nickname = String(np, Charsets.UTF_8)
        if (!isValidNickname(nickname)) return
        DataManager.saveNickname(userInfo.value, nickname, true)

        offset += nameLengthInfo.value
        if (packet.size >= offset + 2) {
            server = ByteBuffer.wrap(packet, offset, 2)
                .order(ByteOrder.LITTLE_ENDIAN)
                .getShort()
                .toInt() and 0xffff
            offset += 2

            if (packet.size >= offset + 1) {
                job = packet[offset].toInt() and 0xff
            }
        }
        if (server != -1) DataManager.saveServer(userInfo.value, server)

    }

    private fun searchOtherNickname(packet: ByteArray, lengthInfo: VarIntOutput) {
        var offset = lengthInfo.length
        if (packet[offset] != 0x44.toByte()) return
        if (packet[offset + 1] != 0x36.toByte()) return

        offset += 2
        if (packet.size < offset) return

        val userInfo = readVarInt(packet, offset)
        offset += userInfo.length
        if (packet.size < offset) return

        val unknownInfo1 = readVarInt(packet, offset)
        offset += unknownInfo1.length
        if (packet.size < offset) return

        val unknownInfo2 = readVarInt(packet, offset)
        offset += unknownInfo2.length
        if (packet.size < offset) return

        if (packet.size - offset <= 2) return
        offset += 1
        val base = offset
        //
        var nickname: String? = null
        var nickEndOffset = -1

        for (i in 0 until 5) {
            offset = base + i
            if (packet.size < offset) continue
            val nicknameLengthInfo = readVarInt(packet, offset)
            if (nicknameLengthInfo.length <= 0) continue

            offset += nicknameLengthInfo.length
            if (nicknameLengthInfo.value < 1 || nicknameLengthInfo.value > 71) continue
            if (packet.size < offset) continue
            if (packet.size < offset + nicknameLengthInfo.value) continue
            val np = packet.copyOfRange(offset, offset + nicknameLengthInfo.value)
            val candidate = String(np, Charsets.UTF_8)

            offset += nicknameLengthInfo.value
            if (!isValidNickname(candidate)) continue
            nickname = candidate
            nickEndOffset = offset
            break
        }
        if (nickname == null || nickEndOffset == -1) return

        offset = nickEndOffset

        val job = packet[offset].toInt() and 0xff
        offset += 1
        if (packet.size < offset) return
        val serverBase = offset

        var server = -1
        var legionName: String? = null
        var i = 0
        while (true) {
            offset = serverBase + i
            i++
            if (packet.size < offset + 2) break
            val serverCandidate = ByteBuffer.wrap(packet, offset, 2)
                .order(ByteOrder.LITTLE_ENDIAN)
                .getShort()
                .toInt() and 0xffff
            if (!(serverCandidate in 1001..1021 || serverCandidate in 2001..2021)) continue
            offset += 2
            if (packet.size < offset) continue
            val LegionNameLengthInfo = readVarInt(packet, offset)
            if (LegionNameLengthInfo.value < 2 || LegionNameLengthInfo.value > 24) continue
            offset += LegionNameLengthInfo.length
            if (packet.size < offset + LegionNameLengthInfo.value) continue
            val lnp = packet.copyOfRange(offset, offset + LegionNameLengthInfo.value)
            val legionNameCandidate = String(lnp, Charsets.UTF_8)
            if (legionNameCandidate.any { !it.isDigit() }) {
                server = serverCandidate
            }
//            if (legionNameCandidate.all { it in '\uAC00'..'\uD7A3' }){
//                legionName = legionNameCandidate
//                break
//            }
        }

        DataManager.saveNickname(userInfo.value, nickname)
        if (server != -1) DataManager.saveServer(userInfo.value, server)

    }

    private fun parseDoTPacket(packet: ByteArray, extraFlag: Boolean, epoch: Long, arrivedAt: Long): Boolean {
        var offset = 0
        val pdp = ParsedDamagePacket()
        pdp.setDot(true)
        val packetLengthInfo = readVarInt(packet)
        if (packetLengthInfo.length < 0) return false
        offset += packetLengthInfo.length

        if (extraFlag) {
            offset += 1
        }
        if (packet[offset] != 0x05.toByte()) return false
        if (packet[offset + 1] != 0x38.toByte()) return false
        offset += 2
        if (packet.size < offset) return false

        val targetInfo = readVarInt(packet, offset)
        if (targetInfo.length < 0) return false
        offset += targetInfo.length
        if (packet.size < offset) return false
        pdp.setTargetId(targetInfo)


        val unknownBitFlagByte = packet[offset]
        if (unknownBitFlagByte.toInt() and 0x02 == 0) return true
        offset++
        // 0a -> 정상범주
        // 08 -> 실패
        // 02 -> 정상범주
        // 03 -> 정상범주
        // 비트플래그? 1010 / 0010 / 0011  성공 1000 실패 -> 두번째 비트?
        // 추후 나머지자리 비트플래그 체크 필요함


        if (packet.size < offset) return false

        val actorInfo = readVarInt(packet, offset)
        if (actorInfo.length < 0) return false
        if (actorInfo.value == targetInfo.value) return false
        offset += actorInfo.length
        if (packet.size < offset) return false
        pdp.setActorId(actorInfo)

        val unknownInfo = readVarInt(packet, offset)
        if (unknownInfo.length < 0) return false
        offset += unknownInfo.length

        val skillCodeCandidate = parseUInt32le(packet, offset)
        val skillCode: Int = if (DataManager.skill((skillCodeCandidate / 10).toLong()) != null) {
            skillCodeCandidate / 10
        } else {
            skillCodeCandidate / 100
        }
        offset += 4
        if (packet.size <= offset) return false
        pdp.setSkillCode(skillCode)

        val damageInfo = readVarInt(packet, offset)
        if (damageInfo.length < 0) return false
        pdp.setDamage(damageInfo)

        logger.debug("{}", toHex(packet))
        logger.debug(
            "도트데미지 공격자 {},피격자 {},스킬 {},데미지 {}",
            pdp.getActorId(),
            pdp.getTargetId(),
            pdp.getSkillCode1(),
            pdp.getDamage()
        )
        logger.debug("----------------------------------")
        if (pdp.getActorId() != pdp.getTargetId()) {
            pdp.setTimestamp(arrivedAt)
            DataManager.saveDamage(pdp, epoch)
            val mobCode = DataManager.mobId(pdp.getTargetId())?:return true
            val mob = DataManager.mob(mobCode)?: return true
            if (mob.isDummy){
                DataManager.touchDummyBattle(pdp.getTargetId(), epoch)
            }
        }
        return true

    }

    private fun findArrayIndex(data: ByteArray, vararg pattern: Int): Int {
        if (pattern.isEmpty()) return 0

        val p = ByteArray(pattern.size) { pattern[it].toByte() }

        val lps = IntArray(p.size)
        var len = 0
        for (i in 1 until p.size) {
            while (len > 0 && p[i] != p[len]) len = lps[len - 1]
            if (p[i] == p[len]) len++
            lps[i] = len
        }

        var i = 0
        var j = 0
        while (i < data.size) {
            if (data[i] == p[j]) {
                i++; j++
                if (j == p.size) return i - j
            } else if (j > 0) {
                j = lps[j - 1]
            } else {
                i++
            }
        }
        return -1
    }

    private fun findArrayIndex(data: ByteArray, p: ByteArray): Int {
        val lps = IntArray(p.size)
        var len = 0
        for (i in 1 until p.size) {
            while (len > 0 && p[i] != p[len]) len = lps[len - 1]
            if (p[i] == p[len]) len++
            lps[i] = len
        }

        var i = 0
        var j = 0
        while (i < data.size) {
            if (data[i] == p[j]) {
                i++; j++
                if (j == p.size) return i - j
            } else if (j > 0) {
                j = lps[j - 1]
            } else {
                i++
            }
        }
        return -1
    }

    private fun parseSummonPacket(packet: ByteArray, extraFlag: Boolean): Boolean {
        var offset = 0
        val packetLengthInfo = readVarInt(packet)
        if (packetLengthInfo.length < 0) return false
        offset += packetLengthInfo.length

        if (extraFlag) {
            offset += 1
        }


        if (packet[offset] != 0x40.toByte()) return false
        if (packet[offset + 1] != 0x36.toByte()) return false
        offset += 2

        val summonInfo = readVarInt(packet, offset)
        if (summonInfo.length < 0) return false

        val codeMarkerIdx = findArrayIndex(packet, 0x00, 0x40, 0x02)
            .takeIf { it != -1 }
            ?: findArrayIndex(packet, 0x00, 0x00, 0x02)
        if (codeMarkerIdx != -1) {
            val mobCode = (packet[codeMarkerIdx - 1].toInt() and 0xFF shl 16) or
                    (packet[codeMarkerIdx - 2].toInt() and 0xFF shl 8) or
                    (packet[codeMarkerIdx - 3].toInt() and 0xFF)
            DataManager.saveMobId(summonInfo.value, mobCode)
//            if (DataManager.mob(mobCode)?.boss == true) {
//                println("${summonInfo.value} 스폰, 몬스터명 ${DataManager.mob(mobCode)?.name}")
//            }
        }


        val keyIdx = findArrayIndex(packet, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff)
        if (keyIdx == -1) return false
        val afterPacket = packet.copyOfRange(keyIdx + 8, packet.size)

        val opcodeIdx = findArrayIndex(afterPacket, 0x07, 0x02, 0x06)
        if (opcodeIdx == -1) return false
        offset = keyIdx + opcodeIdx + 11

        if (offset + 2 > packet.size) return false
        val realActorId = parseUInt16le(packet, offset)

        logger.debug("소환몹 맵핑 성공 {},{}", realActorId, summonInfo.value)
        DataManager.saveSummon(summonInfo.value, realActorId)
        return true
    }

    private fun parseUInt16le(packet: ByteArray, offset: Int = 0): Int {
        return (packet[offset].toInt() and 0xff) or ((packet[offset + 1].toInt() and 0xff) shl 8)
    }

    private fun parseUInt32le(packet: ByteArray, offset: Int = 0): Int {
        require(offset + 4 <= packet.size) { "패킷 길이가 필요길이보다 짧음" }
        return ((packet[offset].toInt() and 0xFF)) or
                ((packet[offset + 1].toInt() and 0xFF) shl 8) or
                ((packet[offset + 2].toInt() and 0xFF) shl 16) or
                ((packet[offset + 3].toInt() and 0xFF) shl 24)
    }

    private fun parsingDamage(packet: ByteArray, extraFlag: Boolean, epoch: Long, arrivedAt: Long): Boolean {
        if (packet[0] == 0x20.toByte()) return false
        var offset = 0
        val packetLengthInfo = readVarInt(packet)
        if (packetLengthInfo.length < 0) return false
        val pdp = ParsedDamagePacket()

        offset += packetLengthInfo.length

        if (extraFlag) {
            offset += 1
        }
        if (offset >= packet.size) return false

        if (packet[offset] != 0x04.toByte()) return false
        if (packet[offset + 1] != 0x38.toByte()) return false
        offset += 2
        if (offset >= packet.size) return false
        val targetInfo = readVarInt(packet, offset)
        if (targetInfo.length < 0) return false
        pdp.setTargetId(targetInfo)
        offset += targetInfo.length //타겟
        if (offset >= packet.size) return false

        val switchInfo = readVarInt(packet, offset)
        if (switchInfo.length < 0) return false
        pdp.setSwitchVariable(switchInfo)
        offset += switchInfo.length //점프용
        if (offset >= packet.size) return false

        val flagInfo = readVarInt(packet, offset)
        if (flagInfo.length < 0) return false
        pdp.setFlag(flagInfo)
        offset += flagInfo.length //플래그
        if (offset >= packet.size) return false

        val actorInfo = readVarInt(packet, offset)
        if (actorInfo.length < 0) return false
        pdp.setActorId(actorInfo)
        offset += actorInfo.length
        if (offset >= packet.size) return false

        if (offset + 5 >= packet.size) return false

        val temp = offset

        var skillCode = parseUInt32le(packet, offset)
        if (DataManager.skill(skillCode.toLong()) == null){
            skillCode = (skillCode / 10) * 10
        }
        pdp.setSkillCode(skillCode)

        offset = temp + 5

        val typeInfo = readVarInt(packet, offset)
        if (typeInfo.length < 0) return false
        pdp.setType(typeInfo)
        offset += typeInfo.length
        if (offset >= packet.size) return false

        val damageType = packet[offset]

        val andResult = switchInfo.value and mask
        val start = offset
        var tempV = 0
        tempV += when (andResult) {
            4 -> 8
            5 -> 12
            6 -> 10
            7 -> 14
            else -> return false
        }
        if (start + tempV > packet.size) return false
        pdp.setSpecials(parseSpecialDamageFlags(packet.copyOfRange(start, start + tempV)))
        offset += tempV


        if (offset >= packet.size) return false

        val unknownInfo = readVarInt(packet, offset)
        if (unknownInfo.length < 0) return false
        pdp.setUnknown(unknownInfo)
        offset += unknownInfo.length
        if (offset >= packet.size) return false

        val damageInfo = readVarInt(packet, offset)
        if (damageInfo.length < 0) return false
        pdp.setDamage(damageInfo)
        offset += damageInfo.length
        if (offset >= packet.size) return false

        val loopInfo = readVarInt(packet, offset)
        if (loopInfo.length < 0) return false
        pdp.setLoop(loopInfo)
        offset += loopInfo.length

//        if (loopInfo.value != 0 && offset >= packet.size) return false
//
//        if (loopInfo.value != 0) {
//            for (i in 0 until loopInfo.length) {
//                var skipValueInfo = readVarInt(packet, offset)
//                if (skipValueInfo.length < 0) return false
//                pdp.addSkipData(skipValueInfo)
//                offset += skipValueInfo.length
//            }
//        }

        if (pdp.getActorId() != pdp.getTargetId()) {
            //추후 hps 를 넣는다면 수정하기
            //혹시 나중에 자기자신에게 데미지주는 보스 기믹이 나오면..
            if (pdp.getDamage() < 10000000) {
                //무의요람 버그수정을 위해 일단 천만이상의 데미지 무시
                pdp.setTimestamp(arrivedAt)
                DataManager.saveDamage(pdp, epoch)
                val mobCode = DataManager.mobId(pdp.getTargetId())
                if (mobCode != null && DataManager.mob(mobCode)?.isDummy == true) {
                    DataManager.touchDummyBattle(pdp.getTargetId(), epoch)
                }
            }
        }
        return true

    }

    fun toHex(bytes: ByteArray): String {
        //출력테스트용
        return bytes.joinToString(" ") { "%02X".format(it) }
    }

    fun readVarInt(bytes: ByteArray, offset: Int = 0): VarIntOutput {
        var value = 0
        var shift = 0
        var count = 0

        while (true) {
            if (offset + count >= bytes.size) {
                logger.error("배열범위초과, 패킷 {} 오프셋 {} count {}", toHex(bytes), offset, count)
                return VarIntOutput(-1, -1)
            }

            val byteVal = bytes[offset + count].toInt() and 0xff
            count++

            value = value or (byteVal and 0x7F shl shift)

            if ((byteVal and 0x80) == 0) {
                return VarIntOutput(value, count)
            }

            shift += 7
            if (shift >= 32) {
                logger.trace(
                    "가변정수 오버플로우, 패킷 {} 오프셋 {} shift {}",
                    toHex(bytes.copyOfRange(offset, offset + 4)),
                    offset,
                    shift
                )
                return VarIntOutput(-1, -1)
            }
        }
    }

    private fun parseSpecialDamageFlags(packet: ByteArray): List<SpecialDamage> {
        val flags = mutableListOf<SpecialDamage>()

        if (packet.size == 8) {
            return emptyList()
        }
        if (packet.size >= 10) {
            val flagByte = packet[0].toInt() and 0xFF

            if ((flagByte and 0x01) != 0) {
                flags.add(SpecialDamage.BACK)
            }
            if ((flagByte and 0x02) != 0) {
                flags.add(SpecialDamage.UNKNOWN)
            }

            if ((flagByte and 0x04) != 0) {
                flags.add(SpecialDamage.PARRY)
            }

            if ((flagByte and 0x08) != 0) {
                flags.add(SpecialDamage.PERFECT)
            }

            if ((flagByte and 0x10) != 0) {
                flags.add(SpecialDamage.DOUBLE)
            }

            if ((flagByte and 0x20) != 0) {
                flags.add(SpecialDamage.ENDURE)
            }

            if ((flagByte and 0x40) != 0) {
                flags.add(SpecialDamage.UNKNOWN4)
            }

            if ((flagByte and 0x80) != 0) {
                flags.add(SpecialDamage.POWER_SHARD)
            }
        }

        return flags
    }

    private fun isValidNickname(str: String): Boolean {
        val hasKoreanOrEnglish = str.any { it in '\uAC00'..'\uD7A3' || it in 'a'..'z' || it in 'A'..'Z' }
        val allValid = str.all {
            it in '\uAC00'..'\uD7A3' ||  // 한글 완성형
                    it in 'a'..'z' ||            // 영어 소문자
                    it in 'A'..'Z' ||            // 영어 대문자
                    it.isDigit()                 // 숫자
        }
        return hasKoreanOrEnglish && allValid
    }

    private fun parseBattlePacket(packet: ByteArray, lengthInfo: VarIntOutput, extraFlag: Boolean): Boolean {
        var offset = lengthInfo.length
        if (extraFlag) {
            offset++
        }
        if (packet.size < offset + 2) return false

        if (packet[offset] != 0x21.toByte()) return false
        if (packet[offset + 1] != 0x8d.toByte()) return false
        offset += 2

        val battleInfo = readVarInt(packet, offset)
        if (battleInfo.length <= 0) return false


        val mobCode = DataManager.mobId(battleInfo.value) ?: return true
        val mob = DataManager.mob(mobCode) ?: return true
        if (mob.boss) {
//            println("${battleInfo.value} 전투시작(종료), 몬스터명 ${
//                DataManager.mobId(battleInfo.value)
//                    ?.let { DataManager.mob(it)?.name }
//            }")
            if (mob.isDummy) return true
            DataManager.toggleBattle(battleInfo.value)
        }
        return true
    }

    private fun parseJoinRequestPacket(packet: ByteArray,lengthInfo: VarIntOutput,extraFlag: Boolean){
        var offset = lengthInfo.length
        if (extraFlag) {
            offset++
        }
        if (packet.size < offset + 2) return

        if (packet[offset] != 0x07.toByte()) return
        if (packet[offset+1] != 0x97.toByte()) return

        val roomNum = parseUInt32le(packet,offset)
        offset += 4

        val unknown = parseUInt32le(packet,offset)
        offset += 4
        val unknown2 = parseUInt32le(packet,offset)
        offset += 4
        val unknown3 = parseUInt32le(packet,offset)
        offset += 4
        val unknown4 = parseUInt32le(packet,offset)
        offset += 4
        val unknown5 = parseUInt32le(packet,offset) // 여기 첫 2바이트 varint uid 값 가능성있음
        offset += 4

        val nicknameLengthInfo = readVarInt(packet,offset)
        offset += nicknameLengthInfo.length
        val np = packet.copyOfRange(offset, offset + nicknameLengthInfo.value)
        offset += nicknameLengthInfo.value

        val server = ByteBuffer.wrap(packet, offset, 2)
            .order(ByteOrder.LITTLE_ENDIAN)
            .getShort()
            .toInt() and 0xffff
        offset += 6

        val power = parseUInt32le(packet,offset)
    }

    private fun parseRemainHp(packet:ByteArray,lengthInfo: VarIntOutput,extraFlag: Boolean):Boolean{
        var offset = lengthInfo.length
        if (extraFlag) {
            offset++
        }
        if (packet.size < offset + 2) return false

        if (packet[offset] != 0x00.toByte()) return false
        if (packet[offset+1] != 0x8d.toByte()) return false
        offset += 2

        val mobIdInfo = readVarInt(packet, offset)
        offset += mobIdInfo.length
        val mobCode = DataManager.mobId(mobIdInfo.value) ?: return true
        val mob = DataManager.mob(mobCode) ?: return true
        if (!mob.boss) return true

        offset += readVarInt(packet, offset).length
        offset += readVarInt(packet, offset).length
        offset += readVarInt(packet, offset).length

        val mobHp = parseUInt32le(packet,offset)
        DataManager.mobHp(mobIdInfo.value,mobHp)
        return true

    }

}
