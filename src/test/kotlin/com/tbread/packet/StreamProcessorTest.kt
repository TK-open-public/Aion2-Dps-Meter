package com.tbread.packet

import com.tbread.DataStorage
import kotlin.test.Test
import kotlin.test.assertContentEquals
import org.junit.jupiter.api.assertDoesNotThrow

class StreamProcessorTest {

    @Test
    fun malformedPacketsAreIgnoredWithoutThrowing() {
        val processor = StreamProcessor(DataStorage())
        val malformedPackets = listOf(
            byteArrayOf(),
            byteArrayOf(0x01),
            byteArrayOf(0x01, 0x02),
            byteArrayOf(0x01, 0x02, 0x03),
            byteArrayOf(0x05, 0x38),
            byteArrayOf(0x04, 0x38, 0x01),
            byteArrayOf(0x7F, 0x7F, 0x7F, 0x7F)
        )

        malformedPackets.forEach { packet ->
            assertDoesNotThrow { processor.onPacketReceived(packet) }
        }
    }

    @Test
    fun convertVarIntProducesExpectedEncoding() {
        val processor = StreamProcessor(DataStorage())

        assertContentEquals(byteArrayOf(0x01), processor.convertVarInt(1))
        assertContentEquals(byteArrayOf(0x80.toByte(), 0x01), processor.convertVarInt(128))
        assertContentEquals(byteArrayOf(0xAC.toByte(), 0x02), processor.convertVarInt(300))
    }
}
