package com.tbread.entity

import kotlinx.serialization.Serializable

@Serializable
data class Buff(val code:Int,val name:String,val summary:String,val effect:String) {
}