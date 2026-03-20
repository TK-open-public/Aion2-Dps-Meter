package com.tbread.entity

data class DpsInformation(var amount: Double = 0.0, var dps: Double = 0.0, var contribution: Double = 0.0) {
    fun addDamage(damage: Double){
        this.amount += amount
    }
}