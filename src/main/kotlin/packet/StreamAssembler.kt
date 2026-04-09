package com.tbread.packet

import org.slf4j.LoggerFactory

class StreamAssembler(private val processor: StreamProcessor) {
    private val logger = LoggerFactory.getLogger(StreamAssembler::class.java)

    private val buffer = PacketAccumulator()

    fun flush() {
        buffer.flush()
    }

    suspend fun processChunk(chunk: ByteArray, arrivedAt: Long) {
        buffer.append(chunk)

        while (buffer.size > 0) {

            val header = buffer.peek(8)
            if (header.isEmpty()) return

            val lengthInfo = processor.readVarInt(header)
            if (lengthInfo.value == 0) {
                buffer.discardBytes(1)
                continue
            }
            if (lengthInfo.value == -1) {
                logger.error("패킷 길이 Varint 체크에서 오류발생 {}", processor.toHex(header))
                buffer.flush()
                break
            }

            val realLength = lengthInfo.value + lengthInfo.length - 4
            if (realLength <= 0) {
                logger.error("패킷 길이 체크에서 오류발생 {}", processor.toHex(header))
                buffer.flush()
                break
            }

            // 아직 패킷 전체가 도착하지 않음 — 더 기다리기
            if (buffer.size < realLength) break

            // 정확히 패킷 크기만큼만 복사 (이전: 전체 버퍼 복사 후 슬라이스)
            val packet = buffer.slice(0, realLength)
            processor.onPacketReceived(packet, arrivedAt)
            buffer.discardBytes(realLength)
        }
    }
}