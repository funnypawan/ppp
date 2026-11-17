package `in`.focuslife.app.data

object Quotes {
    data class Quote(val en: String, val hi: String)

    val all = listOf(
        Quote("Your future depends on what you do today.", "आपका भविष्य आज आप क्या करते हैं, इस पर निर्भर करता है।"),
        Quote("Small progress is still progress.", "छोटी प्रगति भी प्रगति है।"),
        Quote("Control your time, control your life.", "अपने समय को नियंत्रित करें, अपना जीवन नियंत्रित करें।"),
        Quote("Discipline is more important than motivation.", "अनुशासन प्रेरणा से अधिक महत्वपूर्ण है।"),
        Quote("One day, your hard work will pay off.", "एक दिन, आपकी मेहनत रंग लाएगी।"),
        Quote("Do not compare your chapter one with someone else's chapter twenty.", "अपने अध्याय एक की तुलना किसी के अध्याय बीस से न करें।"),
        Quote("Consistency beats intensity.", "निरंतरता तीव्रता से बड़ी है।"),
        Quote("Focus on the process, results will follow.", "प्रक्रिया पर ध्यान दें, परिणाम अपने आप आएंगे।"),
        Quote("Every minute of focus counts.", "फोकस का हर मिनट मायने रखता है।"),
        Quote("You do not have to be extreme, just consistent.", "आपको चरम नहीं होना है, बस निरंतर रहना है।")
    )

    fun dailyQuote(date: String, hindi: Boolean): String {
        val day = try {
            val parts = date.split("-")
            parts[2].toInt()
        } catch (e: Exception) {
            1
        }
        val q = all[(day - 1).mod(all.size)]
        return if (hindi) q.hi else q.en
    }
}
