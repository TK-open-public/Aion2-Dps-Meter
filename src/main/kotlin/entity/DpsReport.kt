package com.tbread.entity

import com.tbread.util.DpsReportSerializer
import kotlinx.serialization.Serializable

@Serializable(with = DpsReportSerializer::class)
data class DpsReport(
    val contributors: MutableSet<User> = mutableSetOf(),
    var battleStart: Long = 0,
    var battleEnd: Long = 0,
    val information: HashMap<Int, DpsInformation> = HashMap(),
    var target: MobInfo? = null,
    @Transient var fakeTimeFlag: Boolean = false,
    @Transient var packets: MutableList<ParsedDamagePacket>? = null
) {
    fun target(mobInfo: MobInfo) {
        this.target = mobInfo
    }

    fun isEmpty(): Boolean {
        return information.isEmpty()
    }

    fun compareBattleTime(time: Long) {
        if (battleStart == 0L) {
            battleStart = time
            fakeTimeFlag = true
        }
        if (battleStart > time && fakeTimeFlag) {
            battleStart = time
        }
        if (battleEnd < time) {
            battleEnd = time
        }
    }
}