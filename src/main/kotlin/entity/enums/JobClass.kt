package com.tbread.entity.enums

import com.tbread.util.JobClassSerializer
import kotlinx.serialization.Serializable

@Serializable(with = JobClassSerializer::class)
enum class JobClass(val className: String, val basicSkillCode: Int) {
    GLADIATOR("검성", 11020000),
    TEMPLAR("수호성", 12010000),
    RANGER("궁성", 14020000),
    ASSASSIN("살성", 13010000),
    SORCERER("마도성", 15210000),
    CLERIC("치유성", 17010000),
    ELEMENTALIST("정령성", 16010000),
    CHANTER("호법성", 18010000);

    companion object {
        fun convertFromSkill(skillCode: Int): JobClass? {
            if (skillCode in 11000000..11999999) {
                return GLADIATOR
            }
            if (skillCode in 12000000..12999999) {
                return TEMPLAR
            }
            if (skillCode in 13000000..13999999) {
                return ASSASSIN
            }
            if (skillCode in 14000000..14999999) {
                return RANGER
            }
            if (skillCode in 15000000..15999999) {
                return SORCERER
            }
            if (skillCode in 16000000..16999999) {
                return ELEMENTALIST
            }
            if (skillCode in 17000000..17999999) {
                return CLERIC
            }
            if (skillCode in 18000000..18999999) {
                return CHANTER
            }
            return null
        }

        fun convertFromCode(job: Int): JobClass? {
            when (job) {
                13, 14, 15, 16 -> {
                    return RANGER
                }

                33,34,35, 36 -> {
                    return CHANTER // 33,35 예상치
                }

                17,18,19, 20 -> {
                    return ASSASSIN // 17,19 예상치
                }

                29, 30,31, 32 -> {
                    return CLERIC // 31 예상치
                }

                21,22, 23, 24 -> {
                    return ELEMENTALIST //21 예상치
                }

                25, 26, 27, 28 -> {
                    return SORCERER
                }

                5, 6, 7, 8 -> {
                    return GLADIATOR // 5는 예상치
                }

                9, 10, 11, 12 -> {
                    return TEMPLAR
                }

                else -> return null
            }
        }
    }
}