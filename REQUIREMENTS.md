# Take-Home Coding Test: Build an Ad Injection Tool

## Objective

Demonstrate your ability to create UIs, work with APIs, handle dynamic content, and integrate it into an existing website in a performant and visually appealing way.

## Overview

You will create a front-end tool that fetches a list of ads from a provided API endpoint and dynamically injects them into a live website.

---

## Requirements

### API Endpoint

Use the following API endpoint to fetch ads:

```
https://storage.cloud.kargo.com/ad/campaign/rm/test/interview-creatives.json
```

This endpoint returns an object in the following format:

```json
{
  "ads": [
    {
      "markup": "PGRpdj5hZDwvZGl2Pg==",
      "size": "300x250",
      "type": "middle"
    }
  ]
}
```

- The `markup` will be base64 encoded.
- The `size` will be two numbers separated by an x
- The `type` is either `middle` or `sticky`

---

## Tasks

1. **Create UI**
   - Use whatever technology you prefer/are comfortable with to create a simple UI with a button that allows the user to begin the ad injection process.
   - There are a variety of ways in which to implement a front-end tool on top of an existing website - choose whichever one you prefer and are most comfortable with.

2. **Fetch Data**
   - When the user clicks the button, make a request to the provided endpoint and retrieve the data.

3. **Inject All Ads Retrieved From Endpoint**
   - Inject the ad `markup` into an existing website (examples provided below).
   - Display each ad at the given width x height provided in the `size` value for the ad.
   - If the ad `type` is `sticky`, attach the ad to the bottom of the screen so that it persists when the user scrolls the page.
   - If the ad `type` is `middle`, insert it between elements in the middle of the page so that it is scrolled away when the user scrolls.

4. **Website for Injection**
   - Ensure your tool works on the following websites:
     - https://www.distractify.com/p/trisha-paytas-broadway-show
     - https://cookieandkate.com/chickpea-tomato-soup-recipe/

5. **X Button**
   - For `sticky` ads, add an X button that will destroy the ad when clicked.

6. **Error Handling**
   - Handle API errors gracefully by displaying an error message to the user.

7. **Responsive Design**
   - Ensure the injected ads are centered and adapt well to different screen sizes.

8. **Optional Enhancements** (Bonus Points)
   - Add some extra pizzazz to make your UI more polished and interesting

---

## Deliverables

1. An `index.html` file with your UI
2. A `script.js` file containing the JavaScript code to complete the functionality.
3. (Optional) Any additional CSS or JavaScript files if you implemented enhancements.

---

## Submission Guidelines

- Package your solution in a zip file or upload it to a GitHub repository.
- Include a README with:
  - Instructions on how to run the project.
  - A brief explanation of your implementation.
  - Any assumptions or design decisions made.

---

## Evaluation Criteria

1. Code quality and readability.
2. Proper use of modern JavaScript (ES6+) or TypeScript
3. Handling of edge cases (loading, errors, etc.).
4. Correct rendering of ads (centered, not cut off, etc.)
5. Creativity and bonus feature implementation.

Good luck! 🎉
