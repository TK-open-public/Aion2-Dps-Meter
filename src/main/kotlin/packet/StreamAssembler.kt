package com.tbread.packet

import org.slf4j.LoggerFactory

class StreamAssembler(private val processor: StreamProcessor) {
    private val logger = LoggerFactory.getLogger(StreamAssembler::class.java)

    private val buffer = PacketAccumulator()

    suspend fun processChunk(chunk: ByteArray) {
        buffer.append(chunk)
        while (true) {
            val fullPacket = buffer.getRange(0)
            if (fullPacket.isEmpty()) return

            val lengthInfo = processor.readVarInt(fullPacket)
            if (lengthInfo.value == 0) {
                buffer.discardBytes(1)
                continue
            }
            if (lengthInfo.value == -1){
                logger.error("패킷 길이 Varint 체크에서 오류발생 {}", processor.toHex(fullPacket))
                buffer.flush()
                break
            }
            val realLength = lengthInfo.value + lengthInfo.length - 4
            if (realLength <= 0) {
                logger.error("패킷 길이 체크에서 오류발생 {}", processor.toHex(fullPacket))
                buffer.flush()
                break
            }

            if (fullPacket.size < realLength) break
            processor.onPacketReceived(fullPacket.copyOfRange(0, realLength))
            buffer.discardBytes(realLength)
        }
    }


}