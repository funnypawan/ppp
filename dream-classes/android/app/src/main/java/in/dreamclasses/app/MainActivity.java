package in.dreamclasses.app;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Dream Classes content protection: block screenshots & screen recording
        // on all app screens (lectures, notes, tests). External cameras still cannot
        // be prevented by any software — lectures also carry a personal watermark.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE);
    }
}
