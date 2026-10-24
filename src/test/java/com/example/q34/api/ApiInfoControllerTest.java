package com.example.q34.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ApiInfoController.class)
class ApiInfoControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void rootDescribesAvailableApi() throws Exception {
        mvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("q34-student-api"))
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.endpoints").isArray());
    }
}
