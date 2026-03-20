package com.tbread.entity

import com.tbread.entity.enums.JobClass
import kotlinx.serialization.Serializable

@Serializable
data class User(val id:Int, var nickname:String?=null, var server:Int=-1, var job: JobClass?=null, var isExecutor:Boolean=false){
    override fun hashCode() = id
    override fun equals(other: Any?) = other is User && other.id == id
}
