/* ==========================================================
   Site content. Edit this file to add, remove or change
   exercises, courses and portfolio projects.
   ========================================================== */

const LANGUAGES = {
  c: {
    name: "C",
    accent: "#7fa7c9",
    desc: "Memory, pointers and the machine underneath. The language where mistakes actually explain themselves.",
    cmMode: "text/x-csrc"
  },
  java: {
    name: "Java",
    accent: "#c9705f",
    desc: "Classes, interfaces and building things that scale past a single file.",
    cmMode: "text/x-java"
  },
  python: {
    name: "Python",
    accent: "#5da97a",
    desc: "Fast to write, easy to misuse. Good first language, good place to build real habits.",
    cmMode: "text/x-python"
  },
  linux: {
    name: "Linux",
    accent: "#9b8cc9",
    desc: "The shell, the filesystem, and the habits that make you fast instead of dangerous.",
    cmMode: "text/x-sh"
  }
};

/* Each exercise is a fully runnable program. `starter` contains
   the bug (with a TODO comment); `correction` is the fixed version.
   `expectedOutput` is compared against trimmed stdout for the
   auto-check. `files` (optional) are extra files written next to
   the main file before running (used by the Python file-reading
   exercise). */
const EXERCISES = [
  // ---------------- C ----------------
  {
    id: "c-sum-array",
    lang: "c",
    title: "Sum of an array (off-by-one)",
    difficulty: "beginner",
    prompt: "Fix `sum()` so it adds up exactly the n elements of the array, no more, no less.",
    starter:
`#include <stdio.h>

int sum(int *arr, int n) {
    int total = 0;
    // TODO: fix the loop bound
    for (int i = 0; i <= n; i++)
        total += arr[i];
    return total;
}

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    printf("Sum: %d\\n", sum(arr, 5));
    return 0;
}`,
    expectedOutput: "Sum: 15",
    correction:
`#include <stdio.h>

int sum(int *arr, int n) {
    int total = 0;
    for (int i = 0; i < n; i++)
        total += arr[i];
    return total;
}

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    printf("Sum: %d\\n", sum(arr, 5));
    return 0;
}`,
    explanation: "`i <= n` reads index n, one past the last valid element. Arrays of length n are indexed 0 to n-1, so the loop should stop at `i < n`."
  },
  {
    id: "c-reverse-list",
    lang: "c",
    title: "Reverse a linked list",
    difficulty: "intermediate",
    prompt: "Fix `reverse()` so it reverses the list in place and returns the new head, without losing any nodes.",
    starter:
`#include <stdio.h>
#include <stdlib.h>

struct Node { int val; struct Node* next; };

struct Node* push(struct Node* head, int val) {
    struct Node* n = malloc(sizeof(struct Node));
    n->val = val; n->next = head;
    return n;
}

struct Node* reverse(struct Node* head) {
    struct Node* prev = NULL;
    while (head != NULL) {
        // TODO: this loses the rest of the list — fix it
        head->next = prev;
        prev = head;
    }
    return prev;
}

void printList(struct Node* head) {
    while (head) { printf("%d ", head->val); head = head->next; }
    printf("\\n");
}

int main() {
    struct Node* list = NULL;
    for (int i = 1; i <= 5; i++) list = push(list, i);
    list = reverse(list);
    printList(list);
    return 0;
}`,
    expectedOutput: "1 2 3 4 5",
    correction:
`#include <stdio.h>
#include <stdlib.h>

struct Node { int val; struct Node* next; };

struct Node* push(struct Node* head, int val) {
    struct Node* n = malloc(sizeof(struct Node));
    n->val = val; n->next = head;
    return n;
}

struct Node* reverse(struct Node* head) {
    struct Node* prev = NULL;
    while (head != NULL) {
        struct Node* next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}

void printList(struct Node* head) {
    while (head) { printf("%d ", head->val); head = head->next; }
    printf("\\n");
}

int main() {
    struct Node* list = NULL;
    for (int i = 1; i <= 5; i++) list = push(list, i);
    list = reverse(list);
    printList(list);
    return 0;
}`,
    explanation: "The original overwrites `head->next` before saving it, so the list gets cut after the first node — and since `head` is never advanced, it also loops forever. Save `next` before rewriting the pointer, then advance `head`."
  },
  {
    id: "c-strdup",
    lang: "c",
    title: "String copy without strdup",
    difficulty: "advanced",
    prompt: "Fix `my_strdup()` so it allocates enough space for the string plus its null terminator.",
    starter:
`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char* my_strdup(const char* s) {
    // TODO: allocate the right size and check malloc's result
    char* copy = malloc(strlen(s));
    strcpy(copy, s);
    return copy;
}

int main() {
    char* copy = my_strdup("hello");
    printf("%s\\n", copy);
    free(copy);
    return 0;
}`,
    expectedOutput: "hello",
    correction:
`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char* my_strdup(const char* s) {
    char* copy = malloc(strlen(s) + 1);
    if (copy != NULL)
        strcpy(copy, s);
    return copy;
}

int main() {
    char* copy = my_strdup("hello");
    printf("%s\\n", copy);
    free(copy);
    return 0;
}`,
    explanation: "`strlen` doesn't count the null terminator, so the buffer is one byte short and `strcpy` overflows it — undefined behavior that may or may not visibly break here. Always allocate `strlen(s) + 1`, and check `malloc`'s return before writing to it."
  },

  // ---------------- Java ----------------
  {
    id: "java-equals",
    lang: "java",
    title: "equals() vs ==",
    difficulty: "beginner",
    prompt: "Fix the comparison so it checks the text of the strings, not their object references.",
    starter:
`public class Main {
    public static void main(String[] args) {
        String name1 = new String("Ada");
        String name2 = new String("Ada");
        // TODO: this compares references, not text — fix it
        if (name1 == name2) {
            System.out.println("same name");
        } else {
            System.out.println("different name");
        }
    }
}`,
    expectedOutput: "same name",
    correction:
`public class Main {
    public static void main(String[] args) {
        String name1 = new String("Ada");
        String name2 = new String("Ada");
        if (name1.equals(name2)) {
            System.out.println("same name");
        } else {
            System.out.println("different name");
        }
    }
}`,
    explanation: "`==` compares object references, not content. Two strings with identical text can live at different addresses — `new String(...)` guarantees it here. Use `.equals()` for value comparison."
  },
  {
    id: "java-removeif",
    lang: "java",
    title: "ConcurrentModificationException",
    difficulty: "intermediate",
    prompt: "Fix the loop so it removes every even number without throwing at runtime.",
    starter:
`import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(Arrays.asList(1,2,3,4,5,6));
        // TODO: this throws ConcurrentModificationException — fix it
        for (Integer n : numbers) {
            if (n % 2 == 0) numbers.remove(n);
        }
        System.out.println(numbers);
    }
}`,
    expectedOutput: "[1, 3, 5]",
    correction:
`import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(Arrays.asList(1,2,3,4,5,6));
        numbers.removeIf(n -> n % 2 == 0);
        System.out.println(numbers);
    }
}`,
    explanation: "Modifying a list while iterating it with a for-each loop throws at runtime. `removeIf` is built for exactly this and avoids the problem entirely."
  },
  {
    id: "java-comparable",
    lang: "java",
    title: "Comparable & sort order",
    difficulty: "beginner",
    prompt: "Sort students by grade using compareTo, and make the compiler check your override.",
    starter:
`import java.util.*;

class Student implements Comparable<Student> {
    String name; int grade;
    Student(String name, int grade) { this.name = name; this.grade = grade; }
    // TODO: add @Override and avoid subtraction overflow
    public int compareTo(Student s) {
        return grade - s.grade;
    }
    public String toString() { return name; }
}

public class Main {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student("Sam", 82));
        students.add(new Student("Ana", 91));
        students.add(new Student("Lee", 75));
        Collections.sort(students);
        System.out.println(students);
    }
}`,
    expectedOutput: "[Lee, Sam, Ana]",
    correction:
`import java.util.*;

class Student implements Comparable<Student> {
    String name; int grade;
    Student(String name, int grade) { this.name = name; this.grade = grade; }
    @Override
    public int compareTo(Student s) {
        return Integer.compare(this.grade, s.grade);
    }
    public String toString() { return name; }
}

public class Main {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student("Sam", 82));
        students.add(new Student("Ana", 91));
        students.add(new Student("Lee", 75));
        Collections.sort(students);
        System.out.println(students);
    }
}`,
    explanation: "The sort order here is already correct, but two habits are worth building: `@Override` catches signature mistakes at compile time, and `Integer.compare` avoids the overflow that plain subtraction can hit with extreme values."
  },

  // ---------------- Python ----------------
  {
    id: "python-mutable-default",
    lang: "python",
    title: "Mutable default argument",
    difficulty: "intermediate",
    prompt: "Fix `add_item` so each call without a list starts a fresh one, instead of sharing one across calls.",
    starter:
`def add_item(item, items=[]):
    # TODO: fix the mutable default argument
    items.append(item)
    return items

print(add_item("a"))
print(add_item("b"))`,
    expectedOutput: "['a']\n['b']",
    correction:
`def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

print(add_item("a"))
print(add_item("b"))`,
    explanation: "Default arguments are evaluated once, at function definition — every call that omits `items` shares the *same* list, so the buggy version prints `['a']` then `['a', 'b']`. Use `None` as a sentinel and create the list inside the function."
  },
  {
    id: "python-fib-memo",
    lang: "python",
    title: "Fibonacci without memoization",
    difficulty: "beginner",
    prompt: "The result is correct but slow. Add memoization so it doesn't recompute the same values.",
    starter:
`def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

print(fib(10))`,
    expectedOutput: "55",
    correction:
`from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)

print(fib(10))`,
    explanation: "Correct, but exponential — `fib(35)` alone takes noticeable time because the same values get recomputed repeatedly. `lru_cache` memoizes results and turns it linear. Output matches either way; this one's about performance, not correctness."
  },
  {
    id: "python-file-with",
    lang: "python",
    title: "Reading a file without closing it",
    difficulty: "beginner",
    prompt: "Read notes.txt and print its contents, making sure the file always gets closed — even if reading fails.",
    starter:
`f = open("notes.txt")
data = f.read()
print(data)
# TODO: use "with" so the file always closes`,
    files: [{ name: "notes.txt", content: "Practice a little every day." }],
    expectedOutput: "Practice a little every day.",
    correction:
`with open("notes.txt") as f:
    data = f.read()
print(data)`,
    explanation: "The file handle here is never explicitly closed — easy to forget, and it stays open if `read()` raises partway through. `with` guarantees the file closes either way. Output matches either way; this one's about safety, not correctness."
  },

  // ---------------- Linux / bash ----------------
  {
    id: "linux-loop-range",
    lang: "linux",
    title: "Off-by-one in a for loop",
    difficulty: "beginner",
    prompt: "Fix the loop so it prints 1 through 5 inclusive, not 1 through 4.",
    starter:
`#!/bin/bash
for i in $(seq 1 4); do
  # TODO: this stops one short — fix the range
  echo "$i"
done`,
    expectedOutput: "1\n2\n3\n4\n5",
    correction:
`#!/bin/bash
for i in $(seq 1 5); do
  echo "$i"
done`,
    explanation: "`seq 1 4` only counts up to 4. The loop was meant to print 1 through 5 inclusive, so the upper bound needs to be 5."
  },
  {
    id: "linux-string-compare",
    lang: "linux",
    title: "Comparing strings the wrong way",
    difficulty: "beginner",
    prompt: "Fix the comparison so it checks the text of the variable instead of treating it as a number.",
    starter:
`#!/bin/bash
answer="yes"
# TODO: -eq is for numbers, not strings — fix the comparison
if [ "$answer" -eq "yes" ]; then
  echo "confirmed"
else
  echo "not confirmed"
fi`,
    expectedOutput: "confirmed",
    correction:
`#!/bin/bash
answer="yes"
if [ "$answer" = "yes" ]; then
  echo "confirmed"
else
  echo "not confirmed"
fi`,
    explanation: "`-eq` compares integers — bash tries to convert \\\"yes\\\" to a number and errors out. Use `=` (or `==` inside `[[ ]]`) to compare strings."
  },
  {
    id: "linux-grep-case",
    lang: "linux",
    title: "Case-sensitive grep",
    difficulty: "intermediate",
    prompt: "Fix the search so it finds \"Error: disk full\" in log.txt even though the E is capitalized.",
    starter:
`#!/bin/bash
# TODO: this search is case-sensitive and misses "Error" — fix it
grep "error" log.txt`,
    files: [{ name: "log.txt", content: "System started\nWarning: low memory\nError: disk full\nAll good" }],
    expectedOutput: "Error: disk full",
    correction:
`#!/bin/bash
grep -i "error" log.txt`,
    explanation: "`grep` is case-sensitive by default, so searching for \\\"error\\\" skips right past \\\"Error: disk full\\\". The `-i` flag makes the match case-insensitive."
  }
];

const COURSES = [
  {
    lang: "c",
    title: "C Fundamentals",
    modules: [
      "Variables, types & control flow",
      "Functions & the call stack",
      "Pointers & addresses",
      "Arrays, strings & memory",
      "malloc, free & ownership"
    ]
  },
  {
    lang: "java",
    title: "Object-Oriented Java",
    modules: [
      "Classes & objects",
      "Inheritance & interfaces",
      "Collections & generics",
      "Exceptions & streams"
    ]
  },
  {
    lang: "python",
    title: "Python From Zero",
    modules: [
      "Syntax & data types",
      "Functions & scope",
      "Lists, dicts & comprehensions",
      "Classes & modules",
      "Files & exceptions",
      "A small real project"
    ]
  },
  {
    lang: "linux",
    title: "Linux & Shell Basics",
    modules: [
      "Navigating the filesystem",
      "Permissions & ownership",
      "Pipes, redirection & filters",
      "Shell scripting basics",
      "Processes & job control"
    ]
  }
];

const WORK = [
  {
    title: "Task scheduler in C",
    tags: ["c", "posix"],
    desc: "A small priority-queue based job scheduler with a round-robin fallback, built to understand process scheduling from the ground up.",
    url: "#"
  },
  {
    title: "Library management system",
    tags: ["java", "jdbc"],
    desc: "Book checkout tracking with a proper class hierarchy for members, staff and loans, backed by a small SQL database.",
    url: "#"
  },
  {
    title: "Log file analyzer",
    tags: ["python", "cli"],
    desc: "A command-line tool that parses server logs, flags anomalies, and prints a readable summary — my first real \"useful\" script.",
    url: "#"
  },
  {
    title: "Tiny regex engine",
    tags: ["c", "algorithms"],
    desc: "A from-scratch NFA-based matcher supporting literals, *, + and alternation — built to actually understand what regex is doing.",
    url: "#"
  }
];
