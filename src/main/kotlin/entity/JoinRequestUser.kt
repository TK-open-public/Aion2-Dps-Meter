package com.tbread.entity

import kotlinx.serialization.Serializable

@Serializable
data class JoinRequestUser(val nickname:String,val power:Int,val job:String?,val server:Int,val requester:Int)