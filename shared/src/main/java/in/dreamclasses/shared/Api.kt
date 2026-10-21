package `in`.dreamclasses.shared
import retrofit2.http.*
data class Login(val email:String,val password:String); data class Session(val accessToken:String,val expiresIn:Int,val role:String)
data class Material(val id:String,val title:String,val description:String,val subject:String,@com.squareup.moshi.Json(name="class_name") val className:String,val chapter:String,val language:String,@com.squareup.moshi.Json(name="is_paid") val paid:Boolean,@com.squareup.moshi.Json(name="price_paise") val pricePaise:Int,@com.squareup.moshi.Json(name="has_access") val hasAccess:Boolean)
data class Materials(val items:List<Material>); data class Download(val url:String,val expiresIn:Int)
interface DreamApi { @POST("v1/auth/login") suspend fun login(@Body body:Login):Session; @GET("v1/materials") suspend fun materials():Materials; @POST("v1/materials/{id}/download") suspend fun download(@Path("id") id:String):Download }
