package com.tbread.entity

import kotlinx.serialization.Serializable

@Serializable
data class User(val id:Int,var nickname:String?=null,var server:Int=-1,var job:JobClass?=null,var isExecutor:Boolean=false)
