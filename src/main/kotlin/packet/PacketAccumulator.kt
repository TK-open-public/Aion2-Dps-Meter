package com.tbread.packet

import org.slf4j.LoggerFactory


class PacketAccumulator {
    private val logger = LoggerFactory.getLogger(PacketAccumulator::class.java)

    private val MAX_BUFFER_SIZE = 2 * 1024 * 1024   // 2MB
    private val WARN_BUFFER_SIZE = 1024 * 1024        // 1MB
    private val INITIAL_CAPACITY = 64 * 1024          // 64KB

    private var buffer = ByteArray(INITIAL_CAPACITY)
    private var readPos = 0
    private var writePos = 0

    @get:Synchronized
    val size: Int
        get() = writePos - readPos

    @Synchronized
    fun append(data: ByteArray) {
        val currentSize = writePos - readPos
        if (currentSize in (WARN_BUFFER_SIZE + 1) until MAX_BUFFER_SIZE) {
            logger.warn("{} : 버퍼 용량 제한 임박", logger.name)
        }
        if (currentSize >= MAX_BUFFER_SIZE) {
            logger.error("{} : 버퍼 용량 제한 초과, 강제 초기화 진행", logger.name)
            readPos = 0
            writePos = 0
            return
        }
        ensureCapacity(data.size)
        data.copyInto(buffer, writePos)
        writePos += data.size
    }

    /**
     * 버퍼 앞에서 최대 length 바이트를 복사해 반환 (길이 헤더 읽기용)
     */
    @Synchronized
    fun peek(length: Int): ByteArray {
        val count = minOf(length, writePos - readPos)
        if (count <= 0) return ByteArray(0)
        return buffer.copyOfRange(readPos, readPos + count)
    }

    /**
     * readPos 기준 [start, start+length) 범위를 복사해 반환.
     * 패킷 하나 분량만 잘라낼 때 사용
     */
    @Synchronized
    fun slice(start: Int, length: Int): ByteArray {
        val from = readPos + start
        val to = from + length
        if (to > writePos || from < readPos) return ByteArray(0)
        return buffer.copyOfRange(from, to)
    }

    /**
     * 읽기 포인터만 전진, 데이터를 실제로 이동하지 않음.
     * readPos가 버퍼 절반을 넘으면 compact()로 유효 데이터를 앞으로 당김.
     */
    @Synchronized
    fun discardBytes(length: Int) {
        readPos = minOf(readPos + length, writePos)
        if (readPos >= buffer.size / 2) compact()
    }

    @Synchronized
    fun discardLastBytes(length: Int) {
        writePos = maxOf(readPos, writePos - length)
    }

    @Synchronized
    fun flush() {
        readPos = 0
        writePos = 0
    }

    // 외부클래스 코드 호출용
    @Synchronized
    fun getRange(start: Int, endExclusive: Int = writePos - readPos): ByteArray {
        return slice(start, endExclusive - start)
    }

    // 매직 패킷 탐색용 (포인터 기반 탐색)
    @Synchronized
    fun indexOf(target: ByteArray): Int {
        val available = writePos - readPos
        if (available < target.size) return -1
        outer@ for (i in 0..available - target.size) {
            for (j in target.indices) {
                if (buffer[readPos + i + j] != target[j]) continue@outer
            }
            return i
        }
        return -1
    }

    // 유효 데이터를 배열 앞으로 당김.
    private fun compact() {
        val remaining = writePos - readPos
        if (remaining > 0) {
            buffer.copyInto(buffer, 0, readPos, writePos)
        }
        readPos = 0
        writePos = remaining
    }

    private fun ensureCapacity(needed: Int) {
        if (writePos + needed <= buffer.size) return
        compact() // 먼저 앞 공간 확보 시도
        if (writePos + needed > buffer.size) {
            var newSize = buffer.size * 2
            while (newSize < writePos + needed) newSize *= 2
            buffer = buffer.copyOf(newSize)
        }
    }
}