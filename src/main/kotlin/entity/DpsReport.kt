package com.tbread.entity

data class DpsReport(
    val contributors: MutableSet<User> = mutableSetOf(),
    var battleStart: Long = 0,
    var battleEnd: Long = 0,
    val information: HashMap<Int,DpsInformation> = HashMap(),
    var target: MobInfo? = null
) {
    fun target(mobInfo: MobInfo) {
        this.target = mobInfo
    }

    fun compareBattleTime(time: Long) {
        if (battleStart > time) {
            battleStart = time
        }
        if (battleEnd < time) {
            battleEnd = time
        }
    }
}