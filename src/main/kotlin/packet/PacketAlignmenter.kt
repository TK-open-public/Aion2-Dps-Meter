package com.tbread.packet

import java.util.*

class PacketAlignmenter {
    private val holdBuffer = TreeMap<Long, ByteArray>()
    private var nextExpectedSeq: Long = -1L

    fun feed(seq: Long, data: ByteArray): List<ByteArray> {
        if (nextExpectedSeq == -1L) {
            nextExpectedSeq = seq
        }

        holdBuffer[seq] = data
//        println("holdBuffer keys: ${holdBuffer.keys}, nextExpected: $nextExpectedSeq, 들어온 seq: $seq")
        val result = mutableListOf<ByteArray>()

        while (holdBuffer.isNotEmpty()) {
            val firstSeq = holdBuffer.firstKey()

            when {
                firstSeq == nextExpectedSeq -> {
                    val chunk = holdBuffer.remove(firstSeq)!!
                    nextExpectedSeq = (nextExpectedSeq + chunk.size) and 0xffffffffL
                    result.add(chunk)
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