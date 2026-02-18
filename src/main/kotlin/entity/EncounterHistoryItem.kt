package com.tbread.entity

import kotlinx.serialization.Serializable

@Serializable
data class EncounterHistoryItem(
    val token: Long,
    val targetName: String,
    val startedAt: Long,
    val endedAt: Long,
    val battleTime: Long,
    val totalDamage: Long,
    val participantCount: Int,
    val participants: List<EncounterHistoryParticipant> = emptyList(),
)
