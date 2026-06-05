package com.skyworld.survey.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum QuestionType {
    SHORT_TEXT("short_text"),
    LONG_TEXT("long_text"),
    EMAIL("email"),
    SINGLE_CHOICE("choice"),
    MULTIPLE_CHOICE("choice"),
    FILE_UPLOAD("file");

    private final String wireValue;

    QuestionType(String wireValue) {
        this.wireValue = wireValue;
    }

    @JsonValue
    public String getWireValue() {
        return wireValue;
    }

    public boolean isChoice() {
        return this == SINGLE_CHOICE || this == MULTIPLE_CHOICE;
    }

    public boolean isMultipleChoice() {
        return this == MULTIPLE_CHOICE;
    }

    @JsonCreator
    public static QuestionType fromValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        for (QuestionType type : values()) {
            if (type.name().equals(normalized) || type.wireValue.equalsIgnoreCase(value.trim())) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unsupported question type: " + value);
    }
}
