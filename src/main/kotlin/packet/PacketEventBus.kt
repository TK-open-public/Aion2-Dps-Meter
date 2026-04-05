package com.tbread.packet

import com.tbread.entity.JoinRequestUser
import kotlinx.coroutines.flow.MutableSharedFlow

object PacketEventBus {
    val events = MutableSharedFlow<PacketEvent>(extraBufferCapacity = 64)
}

sealed class PacketEvent {
    data class JoinRequest(val user: JoinRequestUser) : PacketEvent()
    data class JoinRequestRemove(val id: Int) : PacketEvent()
}