package com.findmyjob;

import com.findmyjob.service.AtsService;
import org.springframework.mock.web.MockMultipartFile;
import java.io.FileInputStream;
import java.io.File;

public class TestAts {
    public static void main(String[] args) throws Exception {
        System.out.println("Starting AtsService test...");
        // Mock the JobRepository with null (it will NPE on calculateAtsScore but we
        // only want to test extractText)
        AtsService atsService = new AtsService(null);

        File f = new File("test.pdf");
        if (!f.exists()) {
            System.out.println("Need a valid PDF");
            return;
        }

        MockMultipartFile file = new MockMultipartFile("resume", "test.pdf", "application/pdf", new FileInputStream(f));

        try {
            // Using reflection to call the private extractText method
            java.lang.reflect.Method method = AtsService.class.getDeclaredMethod("extractText",
                    org.springframework.web.multipart.MultipartFile.class);
            method.setAccessible(true);
            String text = (String) method.invoke(atsService, file);
            System.out.println("Extracted text length: " + text.length());
            System.out.println("First 50 chars: " + (text.length() > 50 ? text.substring(0, 50) : text));
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
