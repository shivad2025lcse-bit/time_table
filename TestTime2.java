import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class TestTime2 {
    public static void main(String[] args) {
        String[] times = {"01:00 PM", "12:00 PM", "08:40 AM", "04:10 PM"};
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.US);
        for (String t : times) {
            try {
                System.out.println(t + " -> " + LocalTime.parse(t, formatter));
            } catch (Exception e) {
                System.out.println(t + " -> Error: " + e.getMessage());
            }
        }
    }
}
