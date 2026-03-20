package com.tbread.util

import com.tbread.entity.DpsInformation
import com.tbread.entity.DpsReport
import com.tbread.entity.User
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.buildClassSerialDescriptor
import kotlinx.serialization.descriptors.element
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.encoding.encodeStructure
import kotlinx.serialization.serializer

object DpsReportSerializer : KSerializer<DpsReport> {

    override val descriptor = buildClassSerialDescriptor("DpsReport") {
        element<MutableSet<User>>("contributors")
        element<Long>("battleStart")
        element<Long>("battleEnd")
        element<HashMap<Int, DpsInformation>>("information")
    }

    override fun deserialize(decoder: Decoder): DpsReport {
        TODO("Not yet implemented")
    }

    override fun serialize(encoder: Encoder, value: DpsReport) {
        if (value.contributors.isEmpty() && value.battleStart == 0L && value.battleEnd == 0L && value.information.isEmpty()) {
            encoder.encodeStructure(descriptor) {}
            return
        }
        encoder.encodeStructure(descriptor) {
            encodeSerializableElement(descriptor, 0, serializer(), value.contributors)
            encodeLongElement(descriptor, 1, value.battleStart)
            encodeLongElement(descriptor, 2, value.battleEnd)
            encodeSerializableElement(descriptor, 3, serializer(), value.information)
        }
    }
}