package Springboot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Configuration for serving static React frontend files and handling React Router.
 * Spring Boot serves static files from src/main/resources/static by default.
 * This config ensures React Router client-side routes serve index.html for any path
 * that doesn't match a static file.
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        
                        // If resource exists and is readable, return it (static files like JS, CSS, images)
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        
                        // For any non-existent resource (React Router routes), serve index.html
                        // API controllers will handle their routes before this resolver is called
                        requestedResource = location.createRelative("index.html");
                        return requestedResource.exists() && requestedResource.isReadable() 
                                ? requestedResource : null;
                    }
                });
    }
}

