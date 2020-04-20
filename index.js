//global user variable - grab ObjectId?

async function signUp() {
  const un = document.getElementById("username").value;
  const pwd = document.getElementById("password").value;
  try {
    const response = await fetch("http://localhost:3000/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: un, password: pwd }),
    });
    console.log(response);
    if (response.redirected) {
      window.location = response.url;
    }
  } catch (error) {
    console.log(error);
  }
}

async function signIn() {
  const un = document.getElementById("username-in").value;
  const pwd = document.getElementById("password-in").value;
  try {
    const response = await fetch("http://localhost:3000/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: un, password: pwd }),
    });
    console.log(response);
    if (response.redirected) {
      window.location = response.url;
    }
  } catch (error) {
    console.log(error);
  }
}

//[X] fetch to blogpost route
//[X] makes get request to authorization Bearer
//[X] render
async function getPostsByAuthor() {
  try {
    const response = await fetch("http://localhost:3000/blogPosts", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${document.cookie.split("=")[1]}`,
      },
    });
    // console.log(await response.json());
    const blogs = await response.json();
    for (let i = 0; i < blogs.length; i++) {
      document.getElementById(
        "render"
      ).innerHTML += `<label>Written By:</label><p id="author${[i]}">${
        blogs[i].username.username
      } </p><br />
      <p id="blogpost${[i]}">${blogs[i].postBody}</p>`;
    }
  } catch (error) {
    console.log(error);
  }
}

async function logout() {
  const response = await fetch("http://localhost:3000/logout", {
    method: "POST",
  });
  console.log(response);
  window.location = response.url;
}

async function submitBlog() {
  const blogBody = document.getElementById("blog-body").value;
  console.log(blogBody);
  const un = await fetch("http://localhost:3000/user", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${document.cookie.split("=")[1]}`,
    },
  });
  const user = await un.json();
  console.log(user);
  const response = await fetch("http://localhost:3000/blogPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: user[0]._id,
      postBody: blogBody,
    }),
  });
  console.log(response);
  window.location = response.url;
}
