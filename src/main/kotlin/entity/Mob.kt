package com.tbread.entity

import kotlinx.serialization.Serializable

@Serializable
data class Mob(val code: Int, val name: String, val boss: Boolean, @Transient val isDummy: Boolean = false)