package com.tbread.entity

import kotlinx.serialization.Serializable

@Serializable
data class EncounterHistoryParticipant(
    val uid: Int,
    val nickname: String,
    val job: String,
    val dps: Double,
    val damageContribution: Double,
    val totalDamage: Long,
)
