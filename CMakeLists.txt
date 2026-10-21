cmake_minimum_required(VERSION 3.12)
project(tacgen CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_compile_options(-Wall -Wextra)

file(GLOB SOURCES CONFIGURE_DEPENDS "src/*.cpp")

add_executable(tacgen ${SOURCES})
target_include_directories(tacgen PRIVATE src)
