import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TestDelete {
    public static void main(String[] args) throws Exception {
        // Login to get token
        String loginBody = "{\"username\":\"shiva25012007\", \"password\":\"shiv2501\"}";
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest loginReq = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:8081/api/auth/login"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(loginBody))
            .build();
        HttpResponse<String> loginRes = client.send(loginReq, HttpResponse.BodyHandlers.ofString());
        String token = loginRes.body().split("\"token\":\"")[1].split("\"")[0];
        
        System.out.println("Got token: " + token);

        // Try DELETE
        HttpRequest delReq = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:8081/api/students/1"))
            .header("Authorization", "Bearer " + token)
            .DELETE()
            .build();
        HttpResponse<String> delRes = client.send(delReq, HttpResponse.BodyHandlers.ofString());
        
        System.out.println("DELETE status: " + delRes.statusCode());
        System.out.println("DELETE body: " + delRes.body());
    }
}
