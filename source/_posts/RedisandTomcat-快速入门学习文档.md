---
title: "Redis & Tomcat 快速入门学习文档"
date: 2026-08-19 17:00:00
author: ZhangSki
img: /medias/featureimages/8.jpg
top: false
cover: false
coverImg: /medias/featureimages/8.jpg
toc: true
mathjax: false
categories:
  - 后端开发
tags:
  - Redis
  - Tomcat
---

# Redis\&Tomcat 快速入门学习文档

本文档面向零基础学习者，极简梳理**Redis缓存中间件**和**Tomcat Web服务器**的核心概念、核心特性、使用场景、基础实操及协同工作原理，剔除冗余理论，聚焦入门必备知识点，帮助快速掌握两大主流技术组件的核心价值与用法。

# 一、Tomcat 核心知识（Web容器）

## 1\.1 什么是Tomcat

Tomcat 是**开源轻量级Java Web服务器/ Servlet容器**，由Apache基金会开发，是Java Web项目最常用的运行容器。主要用于运行Servlet、JSP等Java Web程序，接收用户HTTP请求、处理业务逻辑、返回响应结果，是B/S架构项目的核心运行载体。

简单理解：**没有Tomcat，Java Web项目无法独立运行**，Tomcat就是Java程序的“运行环境\+请求调度中心”。

## 1\.2 核心定位与核心特性

- **核心定位**：专注运行Java Web应用（War/Jar包），负责HTTP请求解析、线程调度、项目部署、会话管理，不负责缓存、数据库存储。

- **轻量高效**：占用资源少、启动速度快，适配中小型Web项目，稳定性极强，企业主流稳定版本为8\.5、9\.x。

- **标准兼容**：严格遵循Servlet、JSP官方规范，所有标准Java Web项目均可无缝部署。

- **内置功能**：自带Session会话管理、虚拟主机、热部署、线程池管理、请求过滤等基础能力。

## 1\.3 核心组件（入门必懂）

- **Server**：Tomcat顶层服务，代表整个服务器实例，包含所有服务组件。

- **Service**：服务集合，绑定连接器和容器，负责统筹请求处理。

- **Connector（连接器）**：核心请求入口，监听8080端口，解析HTTP协议，接收用户请求、返回响应。

- **Container（容器）**：业务核心，包含Engine、Host、Context，负责运行Web项目。
        

    - Engine：全局引擎，处理所有站点请求；

    - Host：虚拟主机，支持多域名部署；

    - Context：单个Web项目上下文，每个部署的项目对应一个Context，管理项目生命周期。

## 1\.4 核心使用场景

- 运行Java Web项目（SpringMVC、SSM、传统JSP/Servlet项目）；

- 单机/集群部署Web服务，承接前端HTTP请求；

- 配合Nginx实现反向代理、负载均衡，分发后端服务请求。

## 1\.5 基础实操要点

- **默认端口**：8080（可修改conf/server\.xml配置文件更换端口）；

- **项目部署方式**：将War包放入webapps目录，或通过配置Context指定项目路径；

- **核心配置文件**：server\.xml（端口、线程池、集群配置）、context\.xml（数据源、会话配置）；

- **默认会话机制**：单机默认本地Session存储，集群场景下存在会话丢失问题（需配合Redis解决）。

# 二、Redis 核心知识（内存缓存中间件）

## 2\.1 什么是Redis

Redis（Remote Dictionary Server，远程字典服务）是**开源、高性能的内存键值对数据库**，基于ANSI C语言开发，主打高速读写，兼顾持久化能力。区别于MySQL等磁盘数据库，Redis核心数据存储在内存，读写速度可达**十万级QPS**，是企业最主流的缓存中间件。

简单理解：**Redis就是高速临时数据仓库**，用来缓解数据库压力、加速数据查询、存储临时业务数据。

## 2\.2 核心特性

- **极致高性能**：纯内存操作，微秒级响应，远超磁盘数据库，适配高并发场景；

- **丰富数据结构**：不止简单Key\-Value，支持String、Hash、List、Set、Sorted Set等5大基础数据结构，适配各类复杂业务；

- **支持持久化**：提供RDB快照、AOF日志两种持久化方案，防止断电数据丢失；

- **高可用集群**：支持主从复制、哨兵模式、集群模式，实现高可用、负载均衡；

- **丰富扩展能力**：支持过期淘汰、事务、消息订阅发布、分布式锁、限流等高级功能。

## 2\.3 核心核心功能（入门重点）

### 2\.3\.1 五大基础数据结构

- **String字符串**：最常用，存储字符串、数字、二进制数据，适配缓存用户信息、配置、计数器；

- **Hash哈希**：类似Map，适合存储结构化数据（用户信息、商品详情），节省内存；

- **List列表**：有序可重复，底层双向链表，适配消息队列、点赞列表、日志排序；

- **Set集合**：无序不可重复，适配去重、好友列表、抽奖场景；

- **ZSet有序集合**：带权重排序、不可重复，适配排行榜、延时队列。

### 2\.3\.2 内存淘汰策略（高频考点）

Redis内存占满后，自动淘汰数据释放空间，默认策略为**volatile\-lru**，常用策略：

- allkeys\-lru：全局淘汰最近最少使用数据（最常用，适配绝大多数缓存场景）；

- volatile\-lru：仅淘汰带过期时间的最少使用数据；

- volatile\-ttl：优先淘汰即将过期的数据；

- allkeys\-random：随机淘汰全局数据。

### 2\.3\.3 持久化机制

- **RDB（快照）**：定时全量备份内存数据，文件体积小、恢复快，适合冷备；

- **AOF（日志）**：实时记录所有写操作日志，数据丢失率极低，安全性更高。

## 2\.4 核心使用场景

- **热点数据缓存**：缓存商品、首页、用户信息，减少MySQL查询压力；

- **分布式会话共享**：解决Tomcat集群Session不共享、登录失效问题；

- **高并发计数器**：点赞数、浏览量、库存统计；

- **分布式锁**：防止秒杀超卖、并发重复操作；

- **简单消息队列**：实现异步通知、任务排队。

## 2\.5 基础实操要点

- **默认端口**：6379；

- **基础命令**：set/get（增查）、del（删除）、expire（设置过期时间）、keys（查询键）；

- **核心优势对比MySQL**：Redis内存读写快、并发高，适合临时高频数据；MySQL磁盘存储，适合持久化、复杂事务数据。

# 三、Cookie/Session/Token/Code 核心Web基础（必学配套知识）

学习Tomcat（Web容器）与Redis（缓存中间件），必须掌握 **Cookie、Session、Token、Code** 四大Web核心机制。所有网站登录、身份校验、会话保持、接口授权都基于这四类技术实现，同时也是Tomcat会话管理、Redis缓存落地的核心业务场景。

## 3\.1 Cookie 详解（客户端存储机制）

### 3\.1\.1 什么是Cookie

Cookie是**服务器下发、浏览器客户端保存**的小型文本数据（最大4KB），以键值对形式存储在用户浏览器本地。浏览器后续每次请求该服务器时，会自动携带Cookie数据，实现用户身份标记、状态记录。

核心特点：**数据存在客户端、自动携带、无状态协议的状态补偿**（HTTP协议本身无状态，无法记住用户）。

### 3\.1\.2 核心特性

- **存储位置**：浏览器本地（客户端），服务器不存储Cookie数据；

- **生命周期**：分为会话Cookie（浏览器关闭即失效）、持久Cookie（设置expires/max\-age，过期自动清除）；

- **域名限制**：Cookie遵循同源策略，仅所属域名可读取，防止跨站窃取；

- **安全性短板**：存储在前端，可被查看、篡改、窃取，**禁止存储密码、密钥等敏感数据**。

### 3\.1\.3 与Tomcat的关联

Tomcat默认会话机制依赖Cookie：用户首次访问Tomcat项目时，Tomcat生成唯一SessionID，通过响应头写入浏览器Cookie；后续请求浏览器携带该Cookie，Tomcat通过SessionID匹配用户会话。

## 3\.2 Session 详解（服务端会话机制）

### 3\.2\.1 什么是Session

Session是**服务端存储的用户会话对象**，由Tomcat等Web容器创建，用于存储用户登录状态、临时业务数据。每个独立用户对应唯一Session，通过SessionID与客户端Cookie绑定。

简单逻辑：**Cookie存唯一标识（SessionID），Session存真实用户数据**，前后端配合实现会话保持。

### 3\.2\.2 核心特性

- **存储位置**：Web服务器端（默认Tomcat本地内存），数据安全、不可被前端篡改；

- **生命周期**：默认30分钟无操作失效，可在Tomcat中全局配置；

- **依赖Cookie**：绝大多数场景依托Cookie传递SessionID，浏览器禁用Cookie时可通过URL重写兼容；

- **单机局限性**：Tomcat集群下，Session本地化存储导致多节点不共享，这也是Redis实现分布式Session的核心原因。

### 3\.2\.3 Redis\+Session 核心价值（补强原有协同方案）

原生Tomcat Session：单机可用，集群失效、重启丢失、无法扩容。
Redis改造后Session：集中式缓存存储、跨Tomcat节点共享、持久化可控、支持集群高并发，是企业Web项目标准方案。

## 3\.3 Token 详解（分布式身份令牌）

### 3\.3\.1 什么是Token

Token是**服务端生成、下发给客户端的加密身份令牌**，用于替代传统Session，实现前后端分离、分布式项目的身份认证。常见格式为JWT（JSON Web Token），包含用户信息、过期时间、签名加密信息。

### 3\.3\.2 核心特性（对比Session）

- **无状态**：服务端无需存储Token数据，解析签名即可校验身份，大幅减轻服务器压力；

- **跨服务、跨域名**：不受限于单Tomcat节点，适配微服务、分布式集群；

- **客户端存储**：通常存储在浏览器LocalStorage/SessionStorage，不依赖Cookie；

- **自带信息**：Token内部可携带用户ID、权限、角色等非敏感信息，减少数据库查询。

### 3\.3\.3 Redis与Token的协同

单纯Token存在无法主动失效、续签困难的问题，企业主流方案：**Token\+Redis双重校验**

- 用户登录成功，服务端生成Token返回前端；

- 同时将Token存入Redis，设置过期时间，绑定用户信息；

- 每次接口请求，先校验Token合法性，再校验Redis中Token是否有效；

- 退出登录时，直接删除Redis中Token，实现主动失效。

## 3\.4 Code 详解（验证码/授权码机制）

Code是临时授权验证码，是Web安全校验的核心机制，主要分为**图片验证码**和**第三方授权码**两类，全程可结合Redis做缓存管控。

### 3\.4\.1 图片验证码（登录校验）

- **作用**：防止暴力破解、机器刷请求、恶意注册登录；

- **流程**：前端请求验证码 → Tomcat生成随机Code → 存入Redis（设置1\-5分钟过期） → 返回图片给前端 → 用户输入提交 → 服务端校验Redis中Code是否匹配；

- **Redis优势**：自带过期淘汰，无需手动清理过期验证码，高性能适配高频访问。

### 3\.4\.2 授权码（第三方登录）

- **作用**：微信、QQ、GitHub等第三方登录的临时授权凭证；

- **特性**：一次性使用、短期有效、不可复用；

- **流程**：获取临时Code → 用Code换取AccessToken → 获取用户信息 → 完成登录。

## 3\.5 四大核心概念完整对比表

|概念|存储位置|核心作用|适用场景|
|---|---|---|---|
|Cookie|客户端浏览器|存储少量标识数据，自动携带请求|传统Web会话标识、记住登录状态|
|Session|服务端（Tomcat/Redis）|存储用户会话数据，维持登录状态|单体项目、Tomcat集群会话共享|
|Token|客户端本地|分布式身份授权、无状态认证|前后端分离、微服务项目|
|Code|服务端（Redis缓存）|临时安全校验、防刷、授权|验证码登录、第三方授权|

## 3\.6 完整企业级联动流程（终极串联）

用户访问网站 → 浏览器携带Cookie → Tomcat接收请求 → 无Session则跳转登录 → 前端获取验证码Code（缓存至Redis） → 用户输入账号密码\+验证码校验 → 登录成功 → Tomcat生成Session/服务端生成Token并存入Redis → 写入Cookie/返回Token → 后续请求自动鉴权 → 实现长期会话保持

## 3\.9 Cookie / Session / Token / Code 实战示例（可直接看懂）

本节提供**纯实战、最简业务样例**，包含：原始数据样例、Java极简代码、Redis存储结构、完整请求流程，贴合Tomcat\+Redis真实开发场景。

### 3\.9\.1 Code 示例（验证码/授权码）

**业务场景**：登录图片验证码、5分钟过期、一次性有效。

**数据样例**：随机4位数字字母：**8A2S**

**Redis存储结构**

```plain
Key: code:login:192.168.1.100
Val: 8A2S
Expire: 300秒（5分钟）
```

**Java 极简示例（Tomcat后端）**

```java
// 1.生成验证码
String code = getRandomCode(); // 输出 8A2S
// 2.存入Redis，5分钟过期
redisTemplate.opsForValue().set("code:login:" + ip, code, 5, TimeUnit.MINUTES);
// 3.返回给前端图片
```

**校验逻辑**：用户提交验证码后，后端从Redis取值比对，**一致则通过，立即删除Redis验证码（防复用）**。

### 3\.9\.2 Cookie 示例（客户端存储）

**业务场景**：Tomcat默认会话Cookie JSESSIONID

**浏览器存储原始样例**

```plain
Name: JSESSIONID
Value: 56B89C220A11456789ABCDEF12345678
Domain: localhost
Path: /
Expires: 会话过期（关闭浏览器失效）
```

**Java 写Cookie示例**

```java
Cookie cookie = new Cookie("JSESSIONID", session.getId());
cookie.setMaxAge(-1); // 会话Cookie
response.addCookie(cookie);
```

**核心行为**：浏览器下次访问项目，**自动带上此Cookie**，Tomcat根据ID找会话。

### 3\.9\.3 Session 示例（服务端会话，Redis托管版）

**业务场景**：用户登录后存储用户信息，集群共享。

**Session 内存数据样例**

```plain
sessionId = 56B89C220A11456789ABCDEF12345678
session.setAttribute("userId", 10001);
session.setAttribute("username", "test_user");
session.setAttribute("role", "user");
```

**Redis真实存储结构（分布式Session）**

```plain
Key: session:56B89C220A11456789ABCDEF12345678
Value: 序列化后的用户会话对象
Expire: 30分钟
```

**使用特点**：**所有Tomcat节点共用这一条数据**，集群不再掉线。

### 3\.9\.4 Token / JWT 示例（前后端分离）

**业务场景**：登录成功下发令牌，前端存LocalStorage，每次请求Header携带。

**1\.原始简化Token样例**

```plain
<JWT_TOKEN>
```

**2\.请求携带方式（Header）**

```plain
Authorization: Bearer <JWT_TOKEN>
```

**3\.Redis校验方案（解决JWT不能主动注销问题）**

```plain
Key: token:user:10001
Val: 当前有效token串
Expire: 30分钟
```

**登录/注销逻辑**：
登录：生成JWT \+ 写入Redis
注销：**直接删除Redis中Token**，前端即使有Token也失效，完美解决退出登录问题。

## 3\.10 四者最简联动完整示例流程

1\. 前端请求登录页验证码 → 后端生成 **Code** 存入Redis
2\. 用户输入账号密码\+ **Code** 校验通过
3\. 传统Web：Tomcat创建 **Session**，写入 **Cookie\(JSESSIONID\)**
4\. 前后端分离：服务端生成 **Token\(JWT\)** 存入Redis返回前端
5\. 后续所有请求：靠Cookie/Token自动鉴权，识别登录用户

## 3\.7 拓展：Web鉴权完整体系（除Cookie/Session/Token/Code外核心概念）

在日常Java Web、Tomcat\+Redis项目中，除前面四大基础概念，企业开发、面试、接口安全必备**JWT、Access/Refresh Token、SSO、OAuth2\.0、OIDC、SessionId、Nonce、Signature、Header鉴权、黑名单**等核心机制，全部贴合现有技术栈。

### 3\.7\.1 JWT（JSON Web Token）

JWT是**Token的标准化加密格式**，目前行业通用令牌规范，前后端分离、微服务项目标配，是对原生Token的标准化升级。

- **结构**：三段式（Header头部、Payload载荷、Signature签名），Base64编码，可解析不可篡改；

- **核心优势**：自包含信息，服务端无需查询Redis/数据库即可解析用户ID、权限、过期时间；

- **配合Redis用法**：JWT负责鉴权解析，Redis维护令牌黑名单、实现主动注销、过期管控，弥补JWT无法主动失效的缺陷。

### 3\.7\.2 AccessToken / RefreshToken（双令牌机制）

企业生产级标准双令牌方案，解决单Token“安全与体验不可兼得”的问题，广泛用于APP、前后端分离项目。

- **AccessToken（访问令牌）**：短期有效（5–30分钟），每次接口请求携带，用于鉴权，过期快、安全性高；

- **RefreshToken（刷新令牌）**：长期有效（7–30天），不参与业务鉴权，仅用于过期后刷新AccessToken；

- **Redis协同**：双令牌均缓存至Redis，绑定用户，退出登录批量删除，实现强制下线。

### 3\.7\.3 SessionId（会话唯一标识）

Session的核心唯一主键，Tomcat原生生成的32位随机串，是连接Cookie与Session的桥梁。

- Cookie中存储的核心内容就是JSESSIONID（Tomcat默认SessionId名称）；

- Redis集群共享Session的本质：以SessionId为Key，用户会话数据为Value集中缓存；

- 核心作用：精准区分每一个在线用户，实现会话隔离。

### 3\.7\.4 Nonce（一次性随机数）

安全校验类临时随机码，比Code更轻量化，用于防重放、防攻击，常用于登录、接口签名、第三方回调。

- **特性**：一次性使用、短时过期、不可重复；

- **Redis用法**：生成Nonce存入Redis，接口校验后立即删除，杜绝重放攻击。

### 3\.7\.5 Signature（接口签名）

服务端与客户端约定算法生成的加密签名，用于**防篡改、防伪造请求**，多用于后端接口、小程序、第三方对接。

- 原理：参数\+时间戳\+秘钥加密生成签名，服务端校验签名一致性；

- Redis配合：缓存有效时间戳、临时秘钥，防止过期请求与伪造请求。

### 3\.7\.6 Token黑名单/白名单

Redis实现的安全管控机制，是生产级鉴权必备能力。

- **黑名单**：用户退出、修改密码、强制下线时，将未过期Token存入Redis黑名单，拒绝后续请求；

- **白名单**：仅放行Redis中存在的有效令牌，杜绝伪造Token。

### 3\.7\.7 SSO（单点登录）

多系统统一登录方案：**一次登录，全站通行**，适配多个Tomcat站点、多子系统场景。

- 核心架构：独立认证中心 \+ 业务子系统；

- Redis作用：统一缓存全局登录令牌、用户会话，实现跨系统会话共享。

### 3\.7\.8 OAuth2\.0 / OIDC（第三方授权标准）

第三方登录、授权行业标准（微信/QQ/谷歌登录均基于此），是Code授权机制的底层规范。

- OAuth2\.0：专注**授权**（允许第三方获取用户资源）；

- OIDC：在OAuth2\.0基础上增加**身份认证**，返回标准化用户身份信息；

- 流程依赖Code授权码\+Redis缓存临时凭证，保证授权安全。

### 3\.8 全套Web鉴权体系极简总结（全覆盖）

- **基础会话层**：Cookie（客户端存储）、Session（服务端会话）、SessionId（会话唯一键）

- **认证令牌层**：Code（验证码/授权码）、Token、JWT、AccessToken/RefreshToken（双令牌）

- **安全加固层**：Nonce、Signature、Redis黑白名单

- **多系统标准层**：SSO、OAuth2\.0、OIDC

所有机制均可无缝适配 **Tomcat运行 \+ Redis缓存管控**，构成Java Web完整的身份认证、授权、安全防护体系。

# 四、核心区别与协作总结

## 3\.1 问题背景

单机Tomcat的Session存储在本地服务器，一旦搭建**Tomcat集群**（多台服务器分担压力），用户请求可能分发到不同节点，导致Session丢失、频繁掉线、需要重复登录。

## 3\.2 解决方案：Redis实现分布式Session共享

核心原理：**剥离Tomcat本地Session，统一存储到Redis**，所有Tomcat节点共享Redis中的Session数据，无论请求分发到哪台Tomcat，都能读取到用户会话信息，彻底解决集群登录失效问题。

## 3\.3 简易实现步骤

1. 项目引入Redisson\-Tomcat依赖（适配对应Tomcat版本）；

2. 修改Tomcat的context\.xml配置，启用RedisSessionManager；

3. 配置Redis连接地址、端口、密码，将Session托管给Redis；

4. 重启Tomcat集群，实现全节点会话共享。

# 四、核心区别与协作总结

## 4\.1 核心区别

|组件|核心定位|数据存储方式|核心作用|
|---|---|---|---|
|Tomcat|Web运行容器|内存/本地磁盘|运行Java Web程序、处理HTTP请求、调度业务|
|Redis|内存缓存中间件|内存\+磁盘持久化|高速缓存、会话共享、高并发数据处理|

## 4\.2 完整业务流程

用户发起请求 → Nginx负载均衡 → 分发至任意Tomcat节点 → Tomcat处理业务 → 优先查询Redis缓存 → 缓存命中直接返回数据 → 未命中查询MySQL → 回写Redis并返回结果 → Session统一存储Redis

# 五、入门常见问题答疑

- **Q：Tomcat可以单独使用吗？**
A：可以，单机小型项目无需Redis，仅靠Tomcat即可运行，Redis是性能优化、集群扩展的辅助组件。

- **Q：Redis可以替代MySQL吗？**
A：不可以。Redis是缓存，主打高速临时数据；MySQL是持久化数据库，负责存储核心业务数据，二者互补。

- **Q：为什么集群必须用Redis共享Session？**
A：Tomcat本地Session无法跨节点同步，集群场景下会导致登录状态不稳定，Redis集中式存储是目前最主流、最高效的解决方案。

# 六、学习总结

1\. **Tomcat是“运行载体”**：负责跑Java Web项目、处理用户请求，是Web服务的基础容器，核心解决程序运行问题；

2\. **Redis是“性能加速器”**：靠内存高速读写解决高并发、数据库压力大、集群会话问题，是Web项目性能优化的核心中间件；

3\.**二者黄金组合**：Tomcat承载业务运行，Redis优化性能与集群架构，是Java Web企业项目的标准基础架构。

4\. **会话与认证核心逻辑**：Cookie做客户端标识、Session做服务端会话存储、Token做分布式授权、Code做安全校验，四类技术依托Tomcat运行、Redis缓存优化，构成完整的Web身份认证体系。

> （注：部分内容可能由 AI 生成）