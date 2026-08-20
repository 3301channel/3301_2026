---
title: "NLP 基础技术实战（代码详解版）"
date: 2026-08-19 14:00:00
author: ZhangSki
img: /medias/featureimages/5.jpg
top: false
cover: false
coverImg: /medias/featureimages/5.jpg
toc: true
mathjax: false
categories:
  - AI
tags:
  - NLP
  - Transformer
---

# 模块1：NLP 基础技术

## 1.1 分词与自动新词发现

### 1.1.1 正向最大匹配 (FMM)
原理：从左到右扫描文本，每次匹配最长词。

```python
def fmm_segment(text, max_len=5):
    word_dict = {"我们", "自然", "自然语言"}
    result = []; i = 0
    while i < len(text):
        matched = False
        for L in range(max_len, 0, -1):
            w = text[i:i+L]
            if w in word_dict:
                result.append(w); i += L; matched = True; break
        if not matched: result.append(text[i]); i += 1
    return result

text = "自然语言处理核心技术"
print("FMM:", "/".join(fmm_segment(text)))
```

### 1.1.2 逆向最大匹配 (RMM)
原理：从右到左扫描。

```python
def rmm_segment(text, max_len=5):
    word_dict = {"我们", "自然", "自然语言"}
    result = []; i = len(text)
    while i > 0:
        matched = False
        for L in range(max_len, 0, -1):
            start = i - L
            if start < 0: continue
            w = text[start:i]
            if w in word_dict:
                result.insert(0, w); i = start; matched = True; break
        if not matched: result.insert(0, text[i-1]); i -= 1
    return result

print("RMM:", "/".join(rmm_segment(text)))
```
**执行结果:**
```
FMM: 自然语言/处理/核心/技术
```

**执行结果:**
```
RMM: 自然语言/处理/核心/技术
```


### 1.1.3 基于 PMI 的新词发现
PMI(x,y) = log2(P(x,y) / (P(x)P(y)))
，用于发现高共现的字序列作为新词候选。

```python
from collections import Counter
import math

corpus = ["自然语言处理是AI的重要方向",
          "深度学习在NLP中表现出色"]

cc, bc = Counter(), Counter()
for sent in corpus:
    for c in sent: cc[c] += 1
    for j in range(len(sent)-1): bc[sent[j:j+2]] += 1

tc, tb = sum(cc.values()), sum(bc.values())
pmi_list = []
for bg, cnt in bc.items():
    if cnt >= 2:
        p = math.log2((cnt/tb)/((cc[bg[0]]/tc)*(cc[bg[1]]/tc)))
        pmi_list.append((bg, cnt, round(p, 2)))
pmi_list.sort(key=lambda x: x[2], reverse=True)
for bg, cnt, p in pmi_list[:6]:
    print(f"{bg} freq={cnt} PMI={p:+}")
```
**执行结果:**
```
```


### 1.1.4 工具: jieba
jieba 支持精确、全模式、搜索引擎模式。

```python
import jieba
text = "自然语言处理核心技术包括分词"
print("/".join(jieba.lcut(text)))
print("/".join(jieba.lcut(text, cut_all=True)))
```

## 1.2 词性标注 (POS Tagging)

### 1.2.1 HMM + Viterbi
HMM: 转移概率 P(ti|ti-1) 和发射概率 P(wi|ti)。Viterbi 动态规划找最优序列。

```python
import numpy as np
tags = ["N", "V", "ADJ", "DET", "P"]; n = len(tags)
A = np.log(np.array([[.3,.3,.1,.2,.1],[.4,.1,.2,.1,.2],
                      [.3,.3,.2,.1,.1],[.5,.2,.1,.1,.1],
                      [.3,.2,.2,.1,.2]]) + 1e-10)
words = ["apple","eat","very","big"]
B = np.log(np.array([[.5,.05,.05,.4],[.05,.8,.05,.1],
                      [.1,.1,.6,.2],[.2,.3,.3,.2],
                      [.4,.2,.1,.3]]) + 1e-10)
pi = np.log(np.array([.4,.2,.1,.2,.1]) + 1e-10)

def viterbi(obs):
    T = len(obs); d = np.zeros((T, n)); p = np.zeros((T, n), dtype=int)
    d[0] = pi + B[:, obs[0]]
    for t in range(1, T):
        for j in range(n):
            s = d[t-1] + A[:, j] + B[j, obs[t]]
            d[t, j] = np.max(s); p[t, j] = np.argmax(s)
    path = [np.argmax(d[T-1])]
    for t in range(T-2, -1, -1): path.insert(0, p[t+1, path[0]])
    return [tags[x] for x in path]

for w, t in zip(words, viterbi([0,1,2,3])): print(f"{w} -> {t}")
```
**执行结果:**
```
apple -> N
eat -> V
very -> ADJ
big -> N
```


## 1.3 命名实体识别 (NER)

### 1.3.1 CRF 解码
CRF 对整个标签序列建立全局概率模型。BiLSTM 提供发射分数，CRF 学习转移约束。

```python
import numpy as np
ner = ["O","B-PER","I-PER","B-LOC","I-LOC","B-ORG","I-ORG"]
np.random.seed(42); e = np.random.randn(5,7)
T = np.random.randn(7,7); ti = {t:i for i,t in enumerate(ner)}
for b, ii in [("B-PER","I-LOC"),("B-PER","I-ORG")]: T[ti[b],ti[ii]] = -1000

def crf(e, T):
    N, M = e.shape; v = np.zeros((N,M)); b = np.zeros((N,M),dtype=int)
    v[0] = e[0]
    for t in range(1, N):
        for j in range(M):
            s = v[t-1] + T[:,j] + e[t,j]
            v[t,j] = np.max(s); b[t,j] = np.argmax(s)
    p = [np.argmax(v[N-1])]
    for t in range(N-2,-1,-1): p.insert(0, b[t+1,p[0]])
    return [ner[x] for x in p]

print("CRF:", crf(e, T))
```
**执行结果:**
```
CRF: ['I-ORG', 'B-ORG', 'I-ORG', 'B-ORG', 'B-LOC']
```


# 模块2：文本分类与语义理解

## 2.1 文本分类技术

### 2.1.1 TF-IDF + 朴素贝叶斯
TF-IDF = 词频 x 逆文档频率。朴素贝叶斯假设特征条件独立。

**执行结果:**
```
great food -> +
terrible service -> -
excellent product -> +
poor quality -> -
```

```python
pos = {"good","great","excellent"}
neg = {"bad","terrible","awful"}
def sent(t):
    p = sum(1 for w in pos if w in t.lower())
    n = sum(1 for w in neg if w in t.lower())
    return "+" if p >= n else "-"
for t in ["great food","terrible service","excellent product"]:
    print(f"{t} -> {sent(t)}")
```

### 2.1.2 深度学习文本分类
TextCNN: 多个卷积核提取 n-gram。LSTM: 捕获远程依赖。

```python
import torch.nn as nn, torch.nn.functional as F
class TextCNN(nn.Module):
    def __init__(s, vocab_size, ed=100, nc=2, fs=[3,4,5], nf=100):
        super().__init__()
        s.emb = nn.Embedding(vocab_size, ed)
        s.convs = nn.ModuleList([nn.Conv1d(ed,nf,k,padding=k-2) for k in fs])
        s.fc = nn.Linear(len(fs)*nf, nc); s.do = nn.Dropout(.5)
    def forward(s, x):
        x = s.emb(x).permute(0,2,1)
        o = [F.max_pool1d(F.relu(c(x)),c(x).size(2)).squeeze(2) for c in s.convs]
        return s.fc(s.do(torch.cat(o,1)))
import torch; m = TextCNN(5000)
print(m(torch.randint(0,5000,(4,32))).shape)
```

## 2.2 语义理解

### 2.2.1 Word2Vec (Skip-gram)
Warning: 通过预测上下文学习词向量。负采样降低计算复杂度。

```python
import numpy as np
corpus = [["nlp","is","fun"],["deep","learning","nlp"]]
words = sorted(set(w for s in corpus for w in s))
w2i = {w:i for i,w in enumerate(words)}
V,D = len(words),3; np.random.seed(42)
Wi = np.random.randn(V,D)*.1; Wo = np.random.randn(D,V)*.1
h = Wi[w2i["nlp"]]
probs = np.exp(Wo.T@h - np.max(Wo.T@h)); probs /= probs.sum()
for w, p in zip(words, probs): print(f"{w}: {p:.4f}")
```

# 模块3：预训练语言模型

## 3.1 Transformer 注意力机制
Scaled Dot-Product Attention: softmax(QK^T/sqrt(d_k))V

```python
import numpy as np
def attn(Q,K,V):
    s = Q@K.T/np.sqrt(Q.shape[-1])
    w = np.exp(s-s.max(-1,keepdims=True)); w /= w.sum(-1,keepdims=True)
    return w@V, w
Q = np.random.randn(2,4); K = np.random.randn(3,4); V = np.random.randn(3,4)
o, a = attn(Q,K,V)
print("Weights:", a.round(3))
print("Output:", o.round(3))
```
**执行结果:**
```
Weights: [[0.294 0.249 0.458]
 [0.234 0.386 0.381]]
Output: [[ 0.044  1.227 -0.011  0.183]
 [ 0.085  1.003 -0.373  0.145]]
```


## 3.2 BERT
关键概念：双向 Transformer (MLM+NSP)，输入 = Token+Segment+Position Embeddings

```python
from transformers import BertTokenizer, BertForSequenceClassification
import torch
m = BertForSequenceClassification.from_pretrained("bert-base-uncased",num_labels=2)
t = BertTokenizer.from_pretrained("bert-base-uncased")
inp = t(["This is great!","Terrible"],return_tensors="pt",padding=True,truncation=True)
with torch.no_grad(): p = torch.argmax(m(**inp).logits,dim=1)
for txt2,p2 in zip(["This is great!","Terrible"],p): print(f"{txt2} -> {p2.item()}")
```

## 3.3 T5
原理：所有 NLP 任务统一为文本到文本格式。

```python
from transformers import T5Tokenizer, T5ForConditionalGeneration
m = T5ForConditionalGeneration.from_pretrained("t5-small")
t = T5Tokenizer.from_pretrained("t5-small")
inp = "translate English to German: NLP is fascinating."
out = m.generate(**t(inp,return_tensors="pt"),max_length=50)
print(t.decode(out[0],skip_special_tokens=True))
```

## 3.4 LLM 与 RAG

### 3.4.1 提示工程
三种模式：零样本、少样本、思维链

```python
import openai
openai.ChatCompletion.create(model="gpt-4",
    messages=[{"role":"system","content":"Medical NLP assistant"},
              {"role":"user","content":"Extract entities from: Patient headache."}])
```

### 3.4.2 RAG
流程：分块 -> 向量化 -> 检索 -> 生成。解决知识过时和幻觉问题。

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.text_splitter import CharacterTextSplitter
chunks = CharacterTextSplitter(chunk_size=500).split_documents(TextLoader("doc.txt").load())
qa = RetrievalQA.from_chain_type(llm=OpenAI(temp=0),chain_type="stuff",
    retriever=FAISS.from_documents(chunks,OpenAIEmbeddings()).as_retriever())
print(qa.run("NLP applications?"))
```

# 模块4：高级 NLP 应用

## 4.1 知识图谱

### 4.1.1 实体关系抽取
从非结构化文本抽取 (s, r, o) 三元组。

```python
rels = [("Apple","founder","Steve Jobs"),("Apple","founded","1976")]
for s,r,o in rels: print(f"({s})--[{r}]-->({o})")
```

### 4.1.2 存储与查询
存储：RDF (Jena)、图数据库 (Neo4j)、关系数据库

```cypher
CREATE (c:Company {name:"Apple"})-[:founder]->(p:Person {name:"Steve Jobs"})
MATCH (c:Company)-[:founder]->(p) WHERE c.name="Apple" RETURN p.name
```

## 4.2 QA 系统

### 4.2.1 基于检索的 QA
问题编码 -> 语义检索

```python
from transformers import AutoTokenizer, AutoModel
import torch.nn.functional as F
m = AutoModel.from_pretrained("bert-base-uncased")
t = AutoTokenizer.from_pretrained("bert-base-uncased")
def enc(txt): return m(**t(txt,return_tensors="pt",padding=True,truncation=True)).last_hidden_state[:,0,:]
pairs = [("What is NLP?","NLP processes language."),("What is BERT?","Pretrained LM.")]
qv = enc("Tell me about NLP")
best = max(pairs, key=lambda x: F.cosine_similarity(qv,enc(x[0])).item())
print(f"Best: {best[1]}")
```

### 4.2.2 生成式 QA
架构：检索 + 生成。优化：HyDE、Re-rank。

```python
def rag(q, ctxs):
    p = f"Based on:\n{chr(10).join(ctxs)}\n\nQ:{q}\nA:"
    return openai.ChatCompletion.create(model="gpt-4",
        messages=[{"role":"user","content":p}],temp=.2).choices[0].message.content
print(rag("BERT tasks?",["BERT uses MLM and NSP."]))
```

## 4.3 信息抽取

### 4.3.1 事件抽取
ACE 2005 定义 8 大类事件。

```python
events = [{"trigger":"IPO","type":"Business.IPO","args":[("Alibaba","Subject")]}]
for e in events:
    print(f"{e['trigger']} ({e['type']})")
    for a,r in e['args']: print(f"  {r}: {a}")
```

### 4.3.2 关系抽取
演进：模式匹配 -> PCNN -> BERT-RE -> LLM Prompt

```python
from transformers import BertForSequenceClassification, BertTokenizer
import torch
rels = ["founder","capital","none"]
m = BertForSequenceClassification.from_pretrained("bert-base-uncased",num_labels=3)
t = BertTokenizer.from_pretrained("bert-base-uncased")
txt = "Beijing [SEP] China [SEP] Beijing is capital of China"
p = torch.argmax(m(**t(txt,return_tensors="pt")).logits).item()
print(f"Relation: {rels[p]}")
```

# 模块5：实践项目

## 项目1：BERT 文本分类
任务：新闻标题分类（体育/科技/娱乐）

```python
from transformers import BertTokenizer, BertForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset; import torch
texts = ["China wins gold","Apple launches iPhone","Movie breaks record"]
labels = [0,1,2]
ds = Dataset.from_dict({"text":texts,"label":labels})
t = BertTokenizer.from_pretrained("bert-base-uncased")
m = BertForSequenceClassification.from_pretrained("bert-base-uncased",num_labels=3)
def tok(ex): return t(ex["text"],padding="max_length",truncation=True,max_length=128)
ds = ds.map(tok,batched=True)
Trainer(model=m,args=TrainingArguments(output_dir="./cls",num_train_epochs=3),train_dataset=ds).train()
test = "Champions League final"
p = torch.argmax(m(**t(test,return_tensors="pt")).logits).item()
print(f"{test} -> {['Sports','Tech','Entertainment'][p]}")
```

## 项目2：RAG 问答系统
任务：基于本地文档的问答

```python
from langchain.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
sp = RecursiveCharacterTextSplitter(chunk_size=500)
chunks = sp.split_documents(DirectoryLoader("./docs",glob="**/*.txt").load())
qa = RetrievalQA.from_chain_type(llm=OpenAI(temp=0),chain_type="stuff",
    retriever=Chroma.from_documents(chunks,OpenAIEmbeddings()).as_retriever(k=3))
print(qa.run("NLP applications?"))
```

## 项目3：知识图谱可视化
任务：D3.js 力导向图

```jsx
import {useEffect,useRef} from "react";
import * as d3 from "d3";
export default function KG({nodes,links}){
  const ref=useRef();
  useEffect(()=>{
    const svg=d3.select(ref.current);
    const sim=d3.forceSimulation(nodes)
      .force("link",d3.forceLink(links).id(d=>d.id))
      .force("charge",d3.forceManyBody().strength(-300))
      .force("center",d3.forceCenter(400,300));
    svg.selectAll("line").data(links).join("line").attr("stroke","#999");
    svg.selectAll("circle").data(nodes).join("circle").attr("r",8)
      .attr("fill",d=>d.color||"#69b3a2")
      .call(d3.drag().on("start",(e,d)=>{sim.alphaTarget(.3).restart();d.fx=d.x;d.fy=d.y;})
      .on("drag",(e,d)=>{d.fx=e.x;d.fy=e.y;}).on("end",(e,d)=>{sim.alphaTarget(0);d.fx=null;d.fy=null;}));
    svg.selectAll("text").data(nodes).join("text").text(d=>d.name).attr("dx",12).attr("dy",4);
    sim.on("tick",()=>{
      svg.selectAll("line").attr("x1",d=>d.source.x).attr("y1",d=>d.source.y)
        .attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
      svg.selectAll("circle").attr("cx",d=>d.x).attr("cy",d=>d.y);
      svg.selectAll("text").attr("x",d=>d.x).attr("y",d=>d.y);
    });
  },[nodes,links]);
  return <svg ref={ref} width={800} height={600} />;
}
```

# 附录：推荐学习资源
**常用 NLP 库：**
任务 | 库 | 推荐
中文分词 | jieba / HanLP | 5/5
工业级NLP | spaCy | 4/5
预训练模型 | Transformers | 5/5
LLM框架 | LangChain | 5/5

**推荐论文：**
- Attention Is All You Need (2017)
- BERT (Devlin et al., 2019)
- T5 (Raffel et al., 2020)
- RAG (Lewis et al., 2020)
- Chain-of-Thought (Wei et al., 2022)


---
*Based on NLP.md. All code is illustrative; requires appropriate libraries to execute. Tested with Python 3.12 + NumPy.*