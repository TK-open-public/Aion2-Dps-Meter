package com.tbread.entity

import kotlinx.serialization.Serializable

@Serializable
data class DpsLog(val report:DpsReport,val summonMap:Map<Int,Int>,val packets: List<ParsedDamagePacket>?) {
}