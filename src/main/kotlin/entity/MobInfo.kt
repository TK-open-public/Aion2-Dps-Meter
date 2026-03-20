package com.tbread.entity

import kotlinx.serialization.Serializable

@Serializable
data class MobInfo(val id:Int,val mob:Mob,var remainHp:Int=0) {
}