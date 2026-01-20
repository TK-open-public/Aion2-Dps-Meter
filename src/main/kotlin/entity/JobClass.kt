package com.tbread.entity

enum class JobClass(val className: String, val basicSkillCode: Int) {
    GLADIATOR("검성", 11020000),
    TEMPLAR("수호성", 12010000),
    RANGER("궁성", 14020000),
    ASSASSIN("살성", 13010000),
    SORCERER("마도성", 15210000), /* 마도 확인 필요함 */
    CLERIC("치유성", 17010000),
    ELEMENTALIST("정령성", 16010000),
    CHANTER("호법성", 18010000);

    companion object{
        fun convertFromSkill(skillCode:Int):JobClass?{
            return entries.find { it.basicSkillCode == skillCode }
        }
    }
}