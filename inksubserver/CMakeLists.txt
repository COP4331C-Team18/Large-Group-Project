cmake_minimum_required(VERSION 3.20)
project(inksubserver LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# --- BUILD TYPE ---
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

# --- FIND PACKAGES ---
find_package(OpenSSL REQUIRED)
find_package(Threads REQUIRED)
find_package(ZLIB REQUIRED)
find_package(CURL REQUIRED)

#Generate compile_commands.json for clangd and other tools
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# --- PLATFORM PATHS ---
if(APPLE)
    # Detect Homebrew prefix — works on both Apple Silicon (/opt/homebrew)
    # and Intel (/usr/local) Macs.
    execute_process(
        COMMAND brew --prefix
        OUTPUT_VARIABLE HOMEBREW_PREFIX
        OUTPUT_STRIP_TRAILING_WHITESPACE
        ERROR_QUIET
    )
    if(NOT HOMEBREW_PREFIX)
        set(HOMEBREW_PREFIX "/opt/homebrew")
    endif()
    message(STATUS "Homebrew prefix: ${HOMEBREW_PREFIX}")

    include_directories(
        "${HOMEBREW_PREFIX}/include"
        "${HOMEBREW_PREFIX}/include/uWebSockets"
        src/Headers
    )

    link_directories("${HOMEBREW_PREFIX}/lib")

    find_library(USOCKETS_LIB
        NAMES uSockets
        PATHS "${HOMEBREW_PREFIX}/lib"
        REQUIRED
    )

    # nlohmann via brew
    find_package(nlohmann_json REQUIRED
        HINTS "${HOMEBREW_PREFIX}/lib/cmake/nlohmann_json"
    )

else()
    include_directories(
        /usr/local/include
        /usr/local/include/uWebSockets
        src/Headers
    )

    find_library(USOCKETS_LIB
        NAMES uSockets
        PATHS /usr/local/lib /usr/lib
        REQUIRED
    )

    # nlohmann via apt or FetchContent fallback
    find_package(nlohmann_json QUIET)
    if(NOT nlohmann_json_FOUND)
        include(FetchContent)
        FetchContent_Declare(json
            URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp
            DOWNLOAD_NO_EXTRACT TRUE
            SOURCE_DIR ${CMAKE_SOURCE_DIR}/src/Headers
        )
        FetchContent_MakeAvailable(json)
    endif()
endif()

# --- SOURCE FILES ---
add_executable(inksubserver
    src/Cpp/main.cpp
    src/Cpp/Link.cpp
)

# --- LINK ---
target_link_libraries(inksubserver
    PRIVATE
    OpenSSL::SSL
    OpenSSL::Crypto
    Threads::Threads
    ZLIB::ZLIB
    ${USOCKETS_LIB}
    CURL::libcurl
)

if(TARGET nlohmann_json::nlohmann_json)
    target_link_libraries(inksubserver PRIVATE nlohmann_json::nlohmann_json)
endif()

# --- OUTPUT ---
set_target_properties(inksubserver PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/build
)