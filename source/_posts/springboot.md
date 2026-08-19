---
title: "Spring Boot 基础学习文档"
date: 2026-08-19 18:00:00
author: ZhangSki
img: /medias/featureimages/9.jpg
top: false
cover: false
coverImg: /medias/featureimages/9.jpg
toc: true
mathjax: false
categories:
  - 后端开发
tags:
  - SpringBoot
---

# Spring Boot 基础学习文档

## 1. Spring Boot 是什么

Spring Boot 是基于 Spring Framework 的快速开发框架。它的核心目标是：

- 减少配置
- 快速创建 Web 后端项目
- 自动管理常用依赖和组件
- 方便打包、运行和部署

简单理解：

```text
Spring Boot = Spring + 自动配置 + Starter 依赖 + 内嵌服务器
```

典型启动类：

```java
@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

`@SpringBootApplication` 不是 `@Override`，它是 Spring Boot 的启动配置注解，大致包含：

```text
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan
```

## 2. Java 注解和注释

注释是给人看的，程序一般不处理：

```java
// 这是注释
```

注解是给编译器、框架或程序看的：

```java
@RestController
public class UserController {
}
```

区别：

```text
注释：说明代码
注解：标记代码，让框架或编译器识别
```

常见 Java 注解：

- `@Override`：表示重写父类或接口方法
- `@Deprecated`：表示不推荐使用
- `@SuppressWarnings`：压制警告
- `@FunctionalInterface`：函数式接口

常见 Spring Boot 注解：

- `@SpringBootApplication`：启动类
- `@RestController`：REST 接口控制器
- `@RequestMapping`：请求路径
- `@GetMapping`：GET 请求
- `@PostMapping`：POST 请求
- `@Service`：业务层组件
- `@Repository`：数据访问层组件
- `@Component`：通用组件
- `@Configuration`：配置类
- `@Bean`：注册 Bean
- `@Autowired`：自动注入
- `@Transactional`：事务
- `@RestControllerAdvice`：全局异常处理
- `@ExceptionHandler`：处理指定异常

## 3. Java 集合基础

集合用于存储一组数据，常见接口：

```text
Collection
├── List
├── Set
└── Queue

Map
```

### List

特点：

```text
有序
可重复
可以通过下标访问
```

示例：

```java
List<String> names = new ArrayList<>();
names.add("Tom");
names.add("Jack");
names.add("Tom");

System.out.println(names.get(0));
```

常用实现：

- `ArrayList`
- `LinkedList`

### Set

特点：

```text
不重复
通常没有下标
```

示例：

```java
Set<String> names = new HashSet<>();
names.add("Tom");
names.add("Tom");

System.out.println(names.size()); // 1
```

常用实现：

- `HashSet`
- `LinkedHashSet`
- `TreeSet`

### Map

特点：

```text
key-value 结构
key 不重复
value 可以重复
```

示例：

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("Tom", 90);
scores.put("Jack", 85);

System.out.println(scores.get("Tom"));
```

## 4. Java 异常基础

异常用于处理程序运行中的错误情况。

异常体系：

```text
Throwable
├── Error
└── Exception
    ├── RuntimeException
    └── 其他受检异常
```

常见运行时异常：

- `NullPointerException`
- `ArrayIndexOutOfBoundsException`
- `ArithmeticException`
- `ClassCastException`
- `NumberFormatException`
- `IllegalArgumentException`

捕获异常：

```java
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("不能除以 0");
} finally {
    System.out.println("最终执行");
}
```

抛出异常：

```java
public void setAge(int age) {
    if (age < 0) {
        throw new IllegalArgumentException("年龄不能小于 0");
    }
}
```

自定义业务异常：

```java
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
```

## 5. Maven 和 Gradle

Maven 和 Gradle 都是 Java 构建工具，负责：

- 管理依赖
- 编译代码
- 运行测试
- 打包项目
- 启动项目

### Maven

配置文件：

```text
pom.xml
```

常用命令：

```bash
mvn clean
mvn compile
mvn test
mvn package
mvn spring-boot:run
```

### Gradle

配置文件：

```text
build.gradle
build.gradle.kts
```

常用命令：

```bash
gradlew.bat clean build
gradlew.bat test
gradlew.bat bootRun
```

初学 Spring Boot，建议先用 Maven。

## 6. Groovy、Kotlin

### Groovy

Groovy 是运行在 JVM 上的编程语言。Gradle 的 `build.gradle` 常用 Groovy 写配置。

示例：

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
}
```

### Kotlin

Kotlin 也是运行在 JVM 上的语言，可以写 Java 后端，也可以写 Android。Gradle 的 `build.gradle.kts` 使用 Kotlin DSL。

示例：

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
}
```

## 7. Spring IOC 和依赖注入

IOC 是 Inversion of Control，中文叫控制反转。

不用 Spring：

```java
private UserService userService = new UserService();
```

用了 Spring：

```java
private final UserService userService;

public UserController(UserService userService) {
    this.userService = userService;
}
```

核心区别：

```text
以前：对象自己 new
现在：对象由 Spring 容器创建和管理
```

被 Spring 管理的对象叫 Bean。

常见 Bean 注解：

- `@Component`
- `@Service`
- `@Repository`
- `@Controller`
- `@RestController`
- `@Configuration`
- `@Bean`

推荐使用构造器注入：

```java
@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }
}
```

## 8. Spring Boot 项目结构

典型结构：

```text
demo
├── pom.xml / build.gradle
├── src
│   ├── main
│   │   ├── java
│   │   │   └── com.example.demo
│   │   │       ├── DemoApplication.java
│   │   │       ├── controller
│   │   │       ├── service
│   │   │       ├── repository / mapper
│   │   │       ├── entity
│   │   │       ├── dto
│   │   │       ├── vo
│   │   │       ├── config
│   │   │       └── exception
│   │   └── resources
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       ├── static
│   │       └── templates
│   └── test
│       └── java
└── target / build
```

核心调用链：

```text
Controller -> Service -> Mapper/Repository -> Database
```

各目录职责：

- `controller`：接收请求，返回响应
- `service`：业务逻辑
- `mapper/repository`：数据库访问
- `entity`：数据库实体
- `dto`：请求对象
- `vo`：响应对象
- `config`：配置类
- `exception`：异常处理
- `resources`：配置文件和静态资源

## 9. Controller 写接口

Controller 负责：

```text
接收请求
解析参数
调用 Service
返回结果
```

示例：

```java
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public UserVO getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    @PostMapping
    public UserVO createUser(@RequestBody UserCreateRequest request) {
        return userService.createUser(request);
    }
}
```

常见接口约定：

```text
GET     /users/1     查询
GET     /users       列表
POST    /users       新增
PUT     /users/1     更新
DELETE  /users/1     删除
```

## 10. 参数接收和 JSON 返回

常见参数来源：

```text
@PathVariable   路径参数       /users/1
@RequestParam   查询参数       /users?page=1
@RequestBody    JSON 请求体    {"name":"Tom"}
@RequestHeader  请求头
@CookieValue    Cookie
```

路径参数：

```java
@GetMapping("/users/{id}")
public UserVO getUser(@PathVariable Long id) {
    return userService.getUser(id);
}
```

查询参数：

```java
@GetMapping("/users")
public List<UserVO> listUsers(
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer size,
        @RequestParam(required = false) String keyword) {
    return userService.listUsers(page, size, keyword);
}
```

JSON 请求体：

```java
@PostMapping("/users")
public UserVO createUser(@RequestBody UserCreateRequest request) {
    return userService.createUser(request);
}
```

使用 `@RestController` 后，返回对象会自动转成 JSON。

## 11. 全局异常处理

推荐使用：

```text
@RestControllerAdvice + @ExceptionHandler
```

统一返回结果：

```java
public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMessage("success");
        result.setData(data);
        return result;
    }

    public static <T> Result<T> fail(Integer code, String message) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMessage(message);
        result.setData(null);
        return result;
    }
}
```

业务异常：

```java
public class BusinessException extends RuntimeException {

    private final Integer code;

    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }

    public Integer getCode() {
        return code;
    }
}
```

全局异常处理：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        return Result.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        return Result.fail(500, "系统异常");
    }
}
```

核心思想：

```text
业务里 throw
全局异常处理器统一返回 JSON
```

## 12. MyBatis 和 JPA

MyBatis 和 JPA 都用于访问数据库。

区别：

```text
MyBatis：自己写 SQL，框架负责执行和映射
JPA：操作 Java 对象，框架自动生成 SQL
```

### MyBatis

Mapper 示例：

```java
@Mapper
public interface UserMapper {

    @Select("select id, name, age from user where id = #{id}")
    User findById(Long id);
}
```

适合：

- 复杂 SQL
- 多表 join
- 需要精确控制 SQL
- 团队熟悉数据库

### JPA

实体：

```java
@Entity
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
}
```

Repository：

```java
public interface UserRepository extends JpaRepository<User, Long> {
}
```

适合：

- 简单 CRUD
- 表结构规整
- 希望少写 SQL
- 更偏对象建模

建议初学优先学 MyBatis，再了解 JPA。

## 13. 配置文件和多环境配置

配置文件位置：

```text
src/main/resources/application.yml
```

常见配置：

```yaml
server:
  port: 8080

spring:
  application:
    name: demo-api
  datasource:
    url: jdbc:mysql://localhost:3306/demo?serverTimezone=Asia/Shanghai
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

多环境文件：

```text
application.yml
application-dev.yml
application-test.yml
application-prod.yml
```

公共配置：

```yaml
spring:
  profiles:
    active: dev
  application:
    name: demo-api
```

开发环境：

```yaml
server:
  port: 8080
```

生产环境：

```yaml
server:
  port: 80
```

启动时指定环境：

```bash
java -jar demo.jar --spring.profiles.active=prod
```

读取配置：

```java
@Value("${app.upload-path}")
private String uploadPath;
```

批量读取配置：

```java
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String name;
    private String uploadPath;
}
```

## 14. 日志

Spring Boot 默认使用：

```text
SLF4J + Logback
```

推荐写法：

```java
private static final Logger log = LoggerFactory.getLogger(UserService.class);

log.info("查询用户，id={}", id);
log.warn("用户 id 为空");
log.error("查询用户失败", e);
```

日志级别：

```text
trace < debug < info < warn < error
```

配置：

```yaml
logging:
  level:
    root: info
    com.example.demo: debug
```

生产环境通常不要开大量 `debug`。

## 15. 测试

测试代码放在：

```text
src/test/java
```

普通单元测试：

```java
class CalculatorTest {

    @Test
    void addShouldReturnSum() {
        Calculator calculator = new Calculator();
        int result = calculator.add(1, 2);
        assertEquals(3, result);
    }
}
```

Spring Boot 测试：

```java
@SpringBootTest
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Test
    void getUserShouldReturnUser() {
        UserVO user = userService.getUser(1L);
        assertNotNull(user);
    }
}
```

Controller 测试：

```java
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getUserShouldReturnOk() throws Exception {
        mockMvc.perform(get("/users/1"))
                .andExpect(status().isOk());
    }
}
```

运行测试：

```bash
mvn test
```

或：

```bash
gradlew.bat test
```

## 16. 打包和部署

Maven 打包：

```bash
mvn clean package
```

生成文件：

```text
target/demo-0.0.1-SNAPSHOT.jar
```

运行：

```bash
java -jar target/demo-0.0.1-SNAPSHOT.jar
```

指定生产环境：

```bash
java -jar target/demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Gradle 打包：

```bash
gradlew.bat clean build
```

生成文件：

```text
build/libs/demo-0.0.1-SNAPSHOT.jar
```

Linux 临时后台运行：

```bash
nohup java -jar demo.jar --spring.profiles.active=prod > app.log 2>&1 &
```

更正式的生产部署通常使用：

- `systemd` 管理进程
- `Nginx` 做反向代理
- 环境变量管理敏感配置
- CI/CD 自动构建和发布

## 17. 推荐学习路线

建议按这个顺序练：

```text
1. Java 基础：集合、异常、注解
2. Maven：依赖、打包、项目结构
3. Spring IOC 和依赖注入
4. Spring Boot 项目结构
5. Controller 写接口
6. 参数接收和 JSON 返回
7. 全局异常处理
8. MyBatis 操作数据库
9. 配置文件和多环境配置
10. 日志、测试、打包部署
```

## 18. 最小实战项目建议

可以做一个用户管理系统：

```text
用户新增
用户查询
用户列表
用户修改
用户删除
```

技术点覆盖：

- `@RestController`
- `@Service`
- `@Mapper`
- `@RequestBody`
- `@PathVariable`
- `@RequestParam`
- `@Valid`
- `@RestControllerAdvice`
- MyBatis
- MySQL
- `application-dev.yml`
- 日志
- 测试
- jar 打包

完成这个项目后，Spring Boot 的基础主线基本就打通了。