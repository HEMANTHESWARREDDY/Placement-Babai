package com.findmyjob.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BugHunterQuestion {
    private String title;
    private String language;
    private String description;
    private List<String> codeLines;
    private int buggyLineIndex;
    private String explanation;
    private int xp = 15;
    private int timeLimit = 45;
}
