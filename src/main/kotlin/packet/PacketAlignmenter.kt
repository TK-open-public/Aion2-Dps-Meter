package com.tbread.packet

import java.util.*

class PacketAlignmenter {
    private val holdBuffer = TreeMap<Long, Pair<ByteArray, Long>>()
    private var nextExpectedSeq: Long = -1L

    fun feed(seq: Long, data: ByteArray, arrivedAt: Long): List<Pair<ByteArray, Long>> {
        if (nextExpectedSeq == -1L) {
            nextExpectedSeq = seq
        }

        holdBuffer[seq] = Pair(data, arrivedAt)
//        println("holdBuffer keys: ${holdBuffer.keys}, nextExpected: $nextExpectedSeq, 들어온 seq: $seq")
        val result = mutableListOf<Pair<ByteArray, Long>>()

        while (holdBuffer.isNotEmpty()) {
            val firstSeq = holdBuffer.firstKey()

            when {
                firstSeq == nextExpectedSeq -> {
                    val (chunk, ts) = holdBuffer.remove(firstSeq)!!
                    nextExpectedSeq = (nextExpectedSeq + chunk.size) and 0xffffffffL
                    result.add(Pair(chunk, ts))
                }
                firstSeq < nextExpectedSeq -> {
                    holdBuffer.remove(firstSeq)
                }
                else -> {
                    break
                }
            }
        }
        return result
    }

    fun reset() {
        holdBuffer.clear()
        nextExpectedSeq = -1L
    }
}