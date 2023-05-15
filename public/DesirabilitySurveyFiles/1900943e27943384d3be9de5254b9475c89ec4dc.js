var jsPsychHtmlKeyboardResponse = (function (jspsych) {
  'use strict';

  const info = {
      name: "html-keyboard-response",
      parameters: {
          /**
           * The HTML string to be displayed.
           */
          stimulus: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Stimulus",
              default: undefined,
          },
          /**
           * Array containing the key(s) the subject is allowed to press to respond to the stimulus.
           */
          choices: {
              type: jspsych.ParameterType.KEYS,
              pretty_name: "Choices",
              default: "ALL_KEYS",
          },
          /**
           * Any content here will be displayed below the stimulus.
           */
          prompt: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Prompt",
              default: null,
          },
          /**
           * How long to show the stimulus.
           */
          stimulus_duration: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Stimulus duration",
              default: null,
          },
          /**
           * How long to show trial before it ends.
           */
          trial_duration: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Trial duration",
              default: null,
          },
          /**
           * If true, trial will end when subject makes a response.
           */
          response_ends_trial: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Response ends trial",
              default: true,
          },
      },
  };
  /**
   * **html-keyboard-response**
   *
   * jsPsych plugin for displaying a stimulus and getting a keyboard response
   *
   * @author Josh de Leeuw
   * @see {@link https://www.jspsych.org/plugins/jspsych-html-keyboard-response/ html-keyboard-response plugin documentation on jspsych.org}
   */
  class HtmlKeyboardResponsePlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
      }
      trial(display_element, trial) {
          var new_html = '<div id="jspsych-html-keyboard-response-stimulus">' + trial.stimulus + "</div>";
          // add prompt
          if (trial.prompt !== null) {
              new_html += trial.prompt;
          }
          // draw
          display_element.innerHTML = new_html;
          // store response
          var response = {
              rt: null,
              key: null,
          };
          // function to end trial when it is time
          const end_trial = () => {
              // kill any remaining setTimeout handlers
              this.jsPsych.pluginAPI.clearAllTimeouts();
              // kill keyboard listeners
              if (typeof keyboardListener !== "undefined") {
                  this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
              }
              // gather the data to store for the trial
              var trial_data = {
                  rt: response.rt,
                  stimulus: trial.stimulus,
                  response: response.key,
              };
              // clear the display
              display_element.innerHTML = "";
              // move on to the next trial
              this.jsPsych.finishTrial(trial_data);
          };
          // function to handle responses by the subject
          var after_response = (info) => {
              // after a valid response, the stimulus will have the CSS class 'responded'
              // which can be used to provide visual feedback that a response was recorded
              display_element.querySelector("#jspsych-html-keyboard-response-stimulus").className +=
                  " responded";
              // only record the first response
              if (response.key == null) {
                  response = info;
              }
              if (trial.response_ends_trial) {
                  end_trial();
              }
          };
          // start the response listener
          if (trial.choices != "NO_KEYS") {
              var keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
                  callback_function: after_response,
                  valid_responses: trial.choices,
                  rt_method: "performance",
                  persist: false,
                  allow_held_key: false,
              });
          }
          // hide stimulus if stimulus_duration is set
          if (trial.stimulus_duration !== null) {
              this.jsPsych.pluginAPI.setTimeout(() => {
                  display_element.querySelector("#jspsych-html-keyboard-response-stimulus").style.visibility = "hidden";
              }, trial.stimulus_duration);
          }
          // end trial if trial_duration is set
          if (trial.trial_duration !== null) {
              this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
          }
      }
      simulate(trial, simulation_mode, simulation_options, load_callback) {
          if (simulation_mode == "data-only") {
              load_callback();
              this.simulate_data_only(trial, simulation_options);
          }
          if (simulation_mode == "visual") {
              this.simulate_visual(trial, simulation_options, load_callback);
          }
      }
      create_simulation_data(trial, simulation_options) {
          const default_data = {
              stimulus: trial.stimulus,
              rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
              response: this.jsPsych.pluginAPI.getValidKey(trial.choices),
          };
          const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
          this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
          return data;
      }
      simulate_data_only(trial, simulation_options) {
          const data = this.create_simulation_data(trial, simulation_options);
          this.jsPsych.finishTrial(data);
      }
      simulate_visual(trial, simulation_options, load_callback) {
          const data = this.create_simulation_data(trial, simulation_options);
          const display_element = this.jsPsych.getDisplayElement();
          this.trial(display_element, trial);
          load_callback();
          if (data.rt !== null) {
              this.jsPsych.pluginAPI.pressKey(data.response, data.rt);
          }
      }
  }
  HtmlKeyboardResponsePlugin.info = info;

  return HtmlKeyboardResponsePlugin;

})(jsPsychModule);
;
var jsPsychSurveyHtmlForm = (function (jspsych) {
  'use strict';

  const info = {
      name: "survey-html-form",
      parameters: {
          /** HTML formatted string containing all the input elements to display. Every element has to have its own distinctive name attribute. The <form> tag must not be included and is generated by the plugin. */
          html: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "HTML",
              default: null,
          },
          /** HTML formatted string to display at the top of the page above all the questions. */
          preamble: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Preamble",
              default: null,
          },
          /** The text that appears on the button to finish the trial. */
          button_label: {
              type: jspsych.ParameterType.STRING,
              pretty_name: "Button label",
              default: "Continue",
          },
          /** The HTML element ID of a form field to autofocus on. */
          autofocus: {
              type: jspsych.ParameterType.STRING,
              pretty_name: "Element ID to focus",
              default: "",
          },
          /** Retrieve the data as an array e.g. [{name: "INPUT_NAME", value: "INPUT_VALUE"}, ...] instead of an object e.g. {INPUT_NAME: INPUT_VALUE, ...}. */
          dataAsArray: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Data As Array",
              default: false,
          },
          /** Setting this to true will enable browser auto-complete or auto-fill for the form. */
          autocomplete: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Allow autocomplete",
              default: false,
          },
      },
  };
  /**
   * **survey-html-form**
   *
   * jsPsych plugin for displaying free HTML forms and collecting responses from all input elements
   *
   * @author Jan Simson
   * @see {@link https://www.jspsych.org/plugins/jspsych-survey-html-form/ survey-html-form plugin documentation on jspsych.org}
   */
  class SurveyHtmlFormPlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
      }
      trial(display_element, trial) {
          var html = "";
          // show preamble text
          if (trial.preamble !== null) {
              html +=
                  '<div id="jspsych-survey-html-form-preamble" class="jspsych-survey-html-form-preamble">' +
                      trial.preamble +
                      "</div>";
          }
          // start form
          if (trial.autocomplete) {
              html += '<form id="jspsych-survey-html-form">';
          }
          else {
              html += '<form id="jspsych-survey-html-form" autocomplete="off">';
          }
          // add form HTML / input elements
          html += trial.html;
          // add submit button
          html +=
              '<input type="submit" id="jspsych-survey-html-form-next" class="jspsych-btn jspsych-survey-html-form" value="' +
                  trial.button_label +
                  '"></input>';
          html += "</form>";
          display_element.innerHTML = html;
          if (trial.autofocus !== "") {
              var focus_elements = display_element.querySelectorAll("#" + trial.autofocus);
              if (focus_elements.length === 0) {
                  console.warn("No element found with id: " + trial.autofocus);
              }
              else if (focus_elements.length > 1) {
                  console.warn('The id "' + trial.autofocus + '" is not unique so autofocus will not work.');
              }
              else {
                  focus_elements[0].focus();
              }
          }
          display_element
              .querySelector("#jspsych-survey-html-form")
              .addEventListener("submit", (event) => {
              // don't submit form
              event.preventDefault();
              // measure response time
              var endTime = performance.now();
              var response_time = Math.round(endTime - startTime);
              var this_form = display_element.querySelector("#jspsych-survey-html-form");
              var question_data = serializeArray(this_form);
              if (!trial.dataAsArray) {
                  question_data = objectifyForm(question_data);
              }
              // save data
              var trialdata = {
                  rt: response_time,
                  response: question_data,
              };
              display_element.innerHTML = "";
              // next trial
              this.jsPsych.finishTrial(trialdata);
          });
          var startTime = performance.now();
          /**
           * Serialize all form data into an array
           * @copyright (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
           * @param  {Node}   form The form to serialize
           * @return {String}      The serialized form data
           */
          function serializeArray(form) {
              // Setup our serialized data
              var serialized = [];
              // Loop through each field in the form
              for (var i = 0; i < form.elements.length; i++) {
                  var field = form.elements[i];
                  // Don't serialize fields without a name, submits, buttons, file and reset inputs, and disabled fields
                  if (!field.name ||
                      field.disabled ||
                      field.type === "file" ||
                      field.type === "reset" ||
                      field.type === "submit" ||
                      field.type === "button")
                      continue;
                  // If a multi-select, get all selections
                  if (field.type === "select-multiple") {
                      for (var n = 0; n < field.options.length; n++) {
                          if (!field.options[n].selected)
                              continue;
                          serialized.push({
                              name: field.name,
                              value: field.options[n].value,
                          });
                      }
                  }
                  // Convert field data to a query string
                  else if ((field.type !== "checkbox" && field.type !== "radio") || field.checked) {
                      serialized.push({
                          name: field.name,
                          value: field.value,
                      });
                  }
              }
              return serialized;
          }
          // from https://stackoverflow.com/questions/1184624/convert-form-data-to-javascript-object-with-jquery
          function objectifyForm(formArray) {
              //serialize data function
              var returnArray = {};
              for (var i = 0; i < formArray.length; i++) {
                  returnArray[formArray[i]["name"]] = formArray[i]["value"];
              }
              return returnArray;
          }
      }
  }
  SurveyHtmlFormPlugin.info = info;

  return SurveyHtmlFormPlugin;

})(jsPsychModule);

const moduleConfig = {
    "desirability" : {
        "pagetitle": "Desirability Survey",
        "alignPrompt": "Which design is the most desirable?",
        "infotext": 
        `<p> We will be asking you to rate the Desirability of various lamp design images.</p>
        <p> Desirability refers to the appeal or attractiveness of each lamp design, representing how much you want to possess in your house according to your preferences.</p>
        <p> Your task is to look at the images and select the <b>most desirable</b> lamp based on your personal preferences and tastes.</p>
        `        
    },
    "beauty": {
        "pagetitle": "Beauty Survey",
        "alignPrompt": "Which design is the most beautiful?",
        "infotext":
        `<p>We will be asking you to rate the Beauty of various lamp design images.</p>
        <p>Beauty refers to the visual appeal or aesthetics of each lamp design, making it pleasing to the eye according to your preferences.</p>
        <p>Your task is to look at the images and select the <b>most beautiful</b> lamp based on your personal preferences and tastes.</p>
        `
    },
    "novelty": {
        "pagetitle": "Novelty Survey",
        "alignPrompt": "Which design is the most novel or unusual?",
        "infotext": 
        `<p>We will be asking you to rate the Novelty/Unusualness of various lamp design images.</p>
        <p>Novelty/Unusualness refers to the uniqueness or innovation of each lamp design, setting it apart from common designs according to your preferences.</p>
        <p>Your task is to look at the images and select the <b>most novel or unusual</b> lamp based on your personal preferences and tastes.</p>
        `
    }
    
};;
// dummy function to avoid rewriting the plugin
function parseFname(fn) {
    return {filename: fn}
}


function insertElement(arr, element, times) {
  if (times < 1) return arr;
  const k = Math.floor(arr.length / (times + 1));
  for (let i = 1; i <= times; i++) {
    const position = i * (k + 1) - 1;
    arr.splice(position, 0, element);
  }
  return arr;
}


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleRandomElements(arr, num) {
  let sampled = [];
  for (let i = 0; i < num; i++) {
    let randomIndex = getRandomInt(0, arr.length - 1);
    sampled.push(arr[randomIndex]);
  }
  return sampled;
}




/*
the function can handle input arrays with sizes not equal to `n * k`. 
It will minimize repetition in the generated samples by shuffling the input 
array and repeating it only as many times as needed to create the desired number of samples.

Here's an example of how to call the updated function:

```javascript
const inputArray = [1, 2, 3, 4, 5, 6, 7, 8];
const numberOfSamples = 4;
const elementsPerSample = 3;
const samples = generateSamples(inputArray, numberOfSamples, elementsPerSample);

console.log(samples);

In this example, the input array has 8 elements, and we want to generate 4 samples 
with 3 elements each. The updated `generateSamples` function will handle this case 
by allowing some repetition in the generated samples while keeping it to a minimum.

*/
function generateSamples(arr, n, k) {
    // Shuffle the input array
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    shuffle(arr);  
    // Repeat the shuffled array enough times to have at least n * k elements
    const repeatedArray = [];
    while (repeatedArray.length < n * k) {
      repeatedArray.push(...arr);
    }
  
    // Split the repeated array into n samples of k elements each
    const samples = [];
    for (let i = 0; i < n; i++) {
      samples.push(repeatedArray.slice(i * k, i * k + k));
    }
    return samples;
  }

  

  function FYshuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };
var plugin_4choice = (function (jspsych) {
  "use strict";

  const info = {
    name: "plugin_4choice",
    parameters: {
      instruction: {
        type: jspsych.ParameterType.STRING,
        default: undefined,
      }
    },
  };

  class plugin_4choice {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    /*
    https://www.jspsych.org/7.3/developers/plugin-development/
    Inside the .trial() method you can do pretty much anything that you want, including modifying the DOM, 
    setting up event listeners, and making asynchronous requests
    
    basically,
    the trial function sets up the display (DOM), registers the event listeners, and waits.

    TODO: https://www.jspsych.org/7.3/reference/jspsych-pluginAPI/#preloadimages 

    */ 
    trial(display_element, trial)
    {
      
      // show image
      let html_content = `
      <div class="instruction-text">
        ${trial.instruction}
      </div>

      <div class="instruction-text-prompt">
        ${trial.alignPrompt}
      </div>
      
      <div class="outer-container">
      
        <div class="container">
          <img decoding="async" src="${trial.filepathprefix + trial.stimuli[0].filename}" class="image" id="0">
          <img decoding="async" src="${trial.filepathprefix + trial.stimuli[1].filename}" class="image" id="1">
        </div>

        <div class="container">
          <img decoding="async" src="${trial.filepathprefix + trial.stimuli[2].filename}" class="image" id="2">
          <img decoding="async" src="${trial.filepathprefix + trial.stimuli[3].filename}" class="image" id="3">      
        </div>
        
        <div>
          <button class="next-button" disabled id="nextButton">Next</button>
        </div>
        
      </div>

      <div>
        <input type="hidden" id="selectedImageId">
      </div>
      `;
      //console.log(html_content);
      display_element.innerHTML = html_content;
      var start_time = performance.now();
      //console.log(start_time)

      /* 
      ============ pasted from ChatGPT ==========
      */
      const images = document.querySelectorAll('.image');
      let selectedImageId;

      images.forEach(image => {
        image.addEventListener('click', e => {
          // Remove border from previously selected image
          if (selectedImageId) {
            document.getElementById(selectedImageId).style.border = 'none';
          }
        // Add border to currently selected image
          image.style.border = '10px solid #95ae48';
          selectedImageId = image.id;
          //console.log(selectedImageId);
          document.getElementById("selectedImageId").value = selectedImageId;

          var nextbutton_element = document.getElementById("nextButton");
          nextbutton_element.removeAttribute("disabled");
        });
      });
      /*
      ===========================================
      */

      const after_mouse_response = () => {  
        var end_time = performance.now();
        //console.log(end_time)
        var calculated_rt = Math.round(end_time - start_time);
        
        // record the data

        let data_saved = {
          rt: calculated_rt,
          selectedImageId: document.getElementById("selectedImageId").value,
          stimuli: trial.stimuli
        }        
        //console.log(data_saved);
        // clear the HTML stuff that was previously created
        display_element.innerHTML = '';    
        
        /* 
        The only requirement for the trial method is that it calls jsPsych.finishTrial() when it is done. 
        This is how jsPsych knows to advance to the next trial in the experiment 
        (or end the experiment if it is the last trial). 
        The plugin can do whatever it needs to do before that point.
        */
        this.jsPsych.finishTrial(data_saved);
      } // after_key_response  ends
    

      const nextbutton_element = document.getElementById("nextButton");
      nextbutton_element.addEventListener("click", after_mouse_response);

      /* // set up a keyboard event to respond only to the spacebar
      this.jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_key_response,
        valid_responses: [' '],
        persist: false
      }); */


      

    }// trial function ends
  }
  plugin_4choice.info = info;

  return plugin_4choice;
})(jsPsychModule);;
// 26 April 2023 - this file contains manually edited entries. do NOT regenerate it with the python script

train_filenames = [
"folder_1/3_2_1_slender man lamp MJ.png",
"folder_4/lamp that has a circled shape, Emits a bright and clear light for visibility in low light conditions, Made out of metal for durability and a modern lookDE.jpg",
"folder_4/lamp that projects photos with a warm color that changes shape according to the memoryDE.jpg",
"folder_7/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelDE(1).jpg",
"folder_7/A lamp with a thin green stem and a bright pink tulip head that looks like it_s blossomingDE.jpg",
"folder_7/A lamp with a warm and cozy wooden-style appearance, incorporating a minimalist and modern concrete element to its design,solid background,render style --upbeta --v 543MJ.png",
"folder_2/Smooth and non-porous porcelain material for easy-to-clean maintenance, blue dimming light, lamp, steampunk, huge, shark-like, wooden feelingDE.jpg",
"folder_9/A simple design that features a wooden base and a soft lighting sourceOJ(1).jpg",
"folder_9/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped topDE.jpg",
"folder_9/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(3)4MJ.png",
"folder_9/A steampunk-inspired lamp with a metallic, industrial base and a mason jar-inspired clear glass housing, The lampshade is designed to mimic the pattern of plant leaves, adding a fresh and calming ambiance to any spaceSD.jpg",
"folder_9/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(4)1MJ.png",
"folder_9/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(1)1MJ.png",
"folder_9/An oil-painting of an sleek and elegant lamp with subtle web-inspired detailsSD(2).jpg",
"folder_9/Clear image, Lamp_s shape, Lamp_s base color, Lamp_s dimensions, Lamp_s lighting properties, Lamp_s power sourceSD.jpg",
"folder_9/Craft a unique lamp, inspired by the beautiful and organic form of a sea urchin, to add a touch of intrigue and natural elegance to your space --upbeta --v 441MJ.png",
];


all_filenames=[
"folder_1/1_1980s sci-fi style lamp MJ.png",
"folder_1/1_T-rex lamp MJ.png",
"folder_1/2_1_Cthulhu lamp MJ.png",
"folder_1/2_1_Make me a lamp that can make everyone else unhappy except me MJ.png",
"folder_1/2_1_a futuristic metal lamp that looks like something from a sci-fi movie MJ.png",
"folder_1/2_1_a lamp from the brand Apple which has its typical design characteristics MJ.png",
"folder_1/2_1_small size lamp for kindergarten playroom MJ.png",
"folder_1/3D printable lamp,  Mosaic patterns, Organic shapes, Nature-inspired designs, Bright and bold color schemes, Unconventional materialsSD.jpg",
"folder_1/3_2_1_Make me a lamp that looks like a lamp MJ.png",
"folder_1/3_2_1_a Chinese-style lamp with fancy dragon-pattern embossment MJ.png",
"folder_1/3_2_1_a lamp from the brand Apple which has its typical design characteristics MJ.png",
"folder_1/3_2_1_slender man lamp MJ.png",
"folder_1/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelSD.jpg",
"folder_1/3d printable lamp, aerodynamic streamline, symmetry, sun lightDE(1).jpg",
"folder_1/3d printable lamp, aerodynamic streamline, symmetryDE.jpg",
"folder_1/3d printable lamp, aerodynamic streamline, symmetrySD.jpg",
"folder_1/3d printable lamp, streamline, symmetry, simple, Intricate filigree details, Baroque style embellishments, Floral motifs, Ornate curves and swirlsDE(2).jpg",
"folder_1/3d printable lamp, streamline, symmetry, simple, Intricate filigree details, Baroque style embellishments, Floral motifs, Ornate curves and swirlsDE.jpg",
"folder_1/3d printable lamp, streamline, symmetry, simple, Intricate filigree details, Baroque style embellishments, Floral motifs, Ornate curves and swirlsSD(2).jpg",
"folder_1/4_3_2_1_lamp combined with plants MJ.png",
"folder_1/A cute lamp made of soft, pastel-colored felt material in the shape of an animalDE.jpg",
"folder_1/A cute lamp made of wood, soft material in the shape of an animalOJ.jpg",
"folder_1/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 541MJ.png",
"folder_1/A cute lamp shaped as a snake made of smooth wood, isometric view,render style, clear background --upbeta --v 542MJ.png",
"folder_1/A cute lamp shaped as a snake made of smooth wood, isometric view,render styleOJ.jpg",
"folder_1/A cute lamp shaped as a snake made of smooth wood, isometric view,render styleSD.jpg",
"folder_1/A lamp handmade from natural materials to create a rustic, earthy aesthetic. The lamp should be crafted from materials such as wood, stone, or natural fibers, and feature a design inspired by the organic shapes found in nature.SD(1).jpg",
"folder_1/A lamp inspired by Donald Trump and Warhammer aesthetics.OJ.jpg",
"folder_1/A lamp inspired by TU Delft blue, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.DE.jpg",
"folder_1/A lamp inspired by civil engineering designs, incorporating industrial materials like steel and concrete, Featuring a streamlined, minimalist design with clean lines and simple shapesSD.jpg",
"folder_1/A lamp inspired by cyberpunk and the aesthetic of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_1/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.DE.jpg",
"folder_1/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.DE(2).jpg",
"folder_1/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.OJ(2).jpg",
"folder_1/A lamp inspired by the Tzeentch factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_1/A lamp inspired by the aesthetic of the Qin Dynasty and horror games, full front, render style, orthographic full view of the design from behind, and a solid color background, photorealistic, orthographic views --upbeta --v 542MJ.png",
"folder_1/A lamp inspired by the aesthetic of the Qin Dynasty and horror games, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_1/A lamp inspired by the aesthetic of the Qin Dynasty and horror games, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_1/A lamp inspired by the cyberpunk and the aesthetics of the armies in Ming Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_1/A lamp inspired by the mixed aesthetics of Deus Ex and the armies in Ming Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_1/A lamp inspired by the slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a transparent background, 3d printed1MJ.png",
"folder_1/A lamp looks weird and makes you feel in the oceanOJ.jpg",
"folder_1/A lamp that has a translucent, dome-shaped shade resembling a jellyfish bell, It has long, trailing tentacles made from fiber-optic cables that emit a soft glow, creating a mesmerizing effectSD.jpg",
"folder_1/A lamp that resembles a furry animal or creature, It has a wireless charging feature for compatible devices, making it a multi-functional accessory for any furry friend lover., The lampshade is made from faux fur, creating a cozy and warm ambianceOJ.jpg",
"folder_1/A lamp that resembles a hairbrush, with a handle and bristles made from flexible plastic or silicone, It has two brightness settings_ one for bright, functional light when needed and another for a soft, warm glow to create a relaxing ambiance.OJ.jpg",
"folder_1/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical piece, solidDE.jpg",
"folder_1/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical piece, solidOJ.jpg",
"folder_1/A lamp that stands at approximately 3 feet tall, with a flat circular base, The lamp emits a bright white light and can be dimmed to create a more subdued ambiance.DE.jpg",
"folder_1/A lamp with a base made from natural wood, with a smooth, polished finish, It features an adjustable arm, allowing users to direct and focus the light on a specific area.DE.jpg",
"folder_1/A lamp with a fluid, organic shape that hints at natural forms, Rendered with bold colors and sharp contrasts to create a striking visual effectOJ.jpg",
"folder_1/A lamp with a geometric design, A lamp that plays nature soundsDE.jpg",
"folder_1/A lamp with a geometric design, A lamp that plays nature soundsSD.jpg",
"folder_1/A lamp with a geometrically shaped lampshade in black and white patterns, like pandaOJ.jpg",
"folder_1/A lamp with a minimalist design in soft colors, with a lampshade made of see-through material, render styleSD.jpg",
"folder_1/A lamp with a minimalist design in soft colours and wood materials, with a lampshade made of see-through material, render styleDE(1).jpg",
"folder_1/A lamp with a minimalist design in soft colours and wood materials, with a lampshade made of see-through material, render styleSD(1).jpg",
"folder_1/A lamp with a warm and cozy wooden-style appearance, incorporating a minimalist and modern concrete element to its design,solid background,render style --upbeta --v 544MJ.png",
"folder_1/A lamp with a warm and cozy wooden-style appearance, incorporating a minimalist and modern concrete element to its designOJ.jpg",
"folder_1/A lamp with an irregular, organic shape, reminiscent of a sea creature, A lamp with a vintage-inspired design, reminiscent of mid-century modern furnitureSD.jpg",
"folder_1/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 54(2)2MJ.png",
"folder_1/A lamp with clean lines and simple shapes, inspired by civil engineering designs, render style, minimalist design --upbeta --v 542MJ.png",
"folder_1/A lamp with, appearance changing from time to time, inclusive, Apex-style,OJ.jpg",
"folder_1/A lamp with, appearance changing from time to time, inclusive, Apex-style,SD.jpg",
"folder_1/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 54(1)3MJ.png",
"folder_1/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(2)4MJ.png",
"folder_1/A sleek and polished lamp design with a web touchDE.jpg",
"folder_1/A sleek, morden and polished lamp design with a web touchOJ.jpg",
"folder_1/A sleek, morden and polished lamp design with a web touchSD.jpg",
"folder_1/A table lamp with a wavy wooden base and a translucent glass shade in the shape of a flowerOJ.jpg",
"folder_1/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render styl --upbeta --v 542MJ.png",
"folder_1/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(2)4MJ.png",
"folder_1/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(4)4MJ.png",
"folder_1/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 542MJ.png",
"folder_1/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuaryDE.jpg",
"folder_1/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth4MJ.png",
"folder_1/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta43MJ.png",
"folder_1/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta44MJ.png",
"folder_1/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 44(2)2MJ.png",
"folder_1/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 441MJ.png",
"folder_1/An oil-painting of an sleek and elegant lamp with subtle web-inspired detailsOJ.jpg",
"folder_1/An oil-painting style, clear background, no furniture, only an elegant and fancy lamp design with subtle web-inspired structures --upbeta --v 442MJ.png",
"folder_1/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 44(2)3MJ.png",
"folder_1/An oil-painting style, without background, only a elegant and sleek lamp design with subtle web-inspired details --upbeta --v 442MJ.png",
"folder_1/Cthulhu lamp MJ.png",
"folder_1/Cthulhu-inspired, cyberpunk, lamp with a slimy ghost-like face, isometric viewpoint, 3d printable.OJ.jpg",
"folder_1/Cybernetic mechanisms, lamp, emotional, dancing, orthographic viewOJ.jpg",
"folder_1/Design a lamp inspired by a jellyfish, with a translucent body, emitting a soft glowing lightOJ.jpg",
"folder_1/Design a lamp inspired by a jellyfish, with a translucent body, emitting a soft glowing lightSD.jpg",
"folder_1/Design a small and compact waterproof 3D-printable lamp that is suitable for travelDE.jpg",
"folder_1/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE(7).jpg",
"folder_1/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ(5).jpg",
"folder_1/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ(6).jpg",
"folder_1/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD(5).jpg",
"folder_1/Features include a dimmable LED light source that flickers like a real candleOJ.jpg",
"folder_1/Features include a dimmable LED light source that flickers like a real candleSD.jpg",
"folder_1/Futuristic 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint --upbeta --v 444MJ.png",
"folder_1/Glow with an eerie light, Add a ghostly atmosphere to any room, A lamp to give you chillsOJ.jpg",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta43MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta44MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation,clear background, isometric view --upbeta --v 543MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation,clear background, isometric view --upbeta41MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta4(1)1MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta41MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization,clear background --upbeta42MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta --v 541MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta --v 544MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta42MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta44MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view --upbeta41MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view --upbeta42MJ.png",
"folder_1/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view, multi-colour light --upbeta4(1)3MJ.png",
"folder_1/Lamp design, Copper lamp base, European-style lampshade, Glass crystal pendant, Hand-carved, Candle-like light bulb, ographic front view,DE.jpg",
"folder_1/Lamp_s minimalist design, Use of sleek materials, Innovative lighting features, Smart technology integration, Unique color schemes, Energy-efficient power sourceOJ.jpg",
"folder_1/Let the peaceful and gentle aura of Lapras inspire a soothing and elegant lamp design, evoking memories of adventure and serenity in your living space --upbeta --v 441MJ.png",
"folder_1/Minimalist teardrop-shaped lamp with a matte black finish, Multi-functional lamp with an extendable arm for reading and writingSD.jpg",
"folder_1/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta --v 542MJ.png",
"folder_1/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta --v 544MJ.png",
"folder_1/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta4(1)1MJ.png",
"folder_1/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta4(1)4MJ.png",
"folder_1/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta41MJ.png",
"folder_1/The lamp_s brightness and color can be easily adjusted by tapping the lamp_s surface, This lamp plugs in via USB or wall outlet, ensuring continuous operation and suitable for all solid color backgroundsSD.jpg",
"folder_1/The lampshade has a 3D-printed image of a T-Rex or other dinosaur, A lamp with a base designed to look like a dinosaur leg or footprint, It features multiple color-changing settings, creating the effect of a colored glow inside the dinosaur figureOJ.jpg",
"folder_1/Unibody 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint2MJ.png",
"folder_1/What flower should the lampshade be shaped like_OJ.jpg",
"folder_1/What flower should the lampshade be shaped like_SD.jpg",
"folder_1/_A lamp with fluid lines, whose form can be gracefully curved towards the ground for a unique, contemporary look._SD.jpg",
"folder_1/_A minimalist lamp with a sleek, modular design that can be easily reconfigured to suit various settings and moods, as it delivers elegant, understated lightingDE.jpg",
"folder_1/_A minimalist lamp with a sleek, modular design that can be easily reconfigured to suit various settings and moods, as it delivers elegant, understated lightingSD.jpg",
"folder_1/_Create a sleek and minimalistic 3D printable lamp with clean lines and a contemporary aesthetic.DE.jpg",
"folder_1/a Chinese-style lamp with fancy dragon-pattern embossment MJ.png",
"folder_1/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lights, planetary engine in the film named the wandering earthDE.jpg",
"folder_1/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lights, planetary engine in the film named the wandering earthOJ(1).jpg",
"folder_1/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsOJ(1).jpg",
"folder_1/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsSD.jpg",
"folder_1/a lamp design, 3d modelling render, game terraria, FULL LAMPOJ(1).jpg",
"folder_1/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPSD(1).jpg",
"folder_1/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --v 541MJ.png",
"folder_1/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPSD(1).jpg",
"folder_1/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPOJ.jpg",
"folder_1/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPSD(2).jpg",
"folder_1/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 54(1)4MJ.png",
"folder_1/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 54(2)4MJ.png",
"folder_1/a lamp with Lovecraft-style and Donald Trump4(2)3MJ.png",
"folder_1/a topology industry style metal lamp with futuristic and a mystical lightDE.jpg",
"folder_1/adjustable, lamp, playful, automatic, artistic, unique, orthographic viewOJ.jpg",
"folder_1/adjustable, lamp, playful, automatic, artistic, unique,DE.jpg",
"folder_1/ancient scenario, fashionable lamp, egg, calender, flower, orthographic front view, exaggerated propotionsSD(1).jpg",
"folder_1/can you answer this question_ lampOJ(1).jpg",
"folder_1/clear background An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception.OJ.jpg",
"folder_1/clear background An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception.SD.jpg",
"folder_1/clear background, An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception.OJ.jpg",
"folder_1/cute robot-shaped lamp with touch screen in a futuristic setting, with a children interacting with itSD.jpg",
"folder_1/cute robot-shaped lamp with touch screen in a futuristic setting, with human shape and big eyesSD.jpg",
"folder_1/cute, natural, lamp, fashion,transparent, coloful, Unique shapeDE.jpg",
"folder_1/female lamp with delft university of technology style on itDE(1).jpg",
"folder_1/female lamp with delft university of technology style on itSD.jpg",
"folder_1/female lampDE.jpg",
"folder_1/female lampSD.jpg",
"folder_1/full female lampOJ.jpg",
"folder_1/international, dutch, lamp,  sex, orthographic front view, exaggerated propotionsOJ.jpg",
"folder_1/lamp design combining a classic toy-inspired appearance vibrant buttons and a vintage twist for interactive funDE.jpg",
"folder_1/lamp design featuring a childish style and light colour tone, with multiple buttons, in a vintage style lamp design with a classic toy-inspired aesthetic and multiple colorful buttons for engaging interactionDE.jpg",
"folder_1/lamp design featuring a childish style and light colour tone, with multiple buttons, in a vintage style lamp design with a classic toy-inspired aesthetic and multiple colorful buttons for engaging interactionOJ.jpg",
"folder_1/lamp design, Minimalism, Visually striking, Streamlined design, Customization, Refined lighting, Space elevation. And the Chinese translationOJ.jpg",
"folder_1/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta --v 542MJ.png",
"folder_1/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta4(2)4MJ.png",
"folder_1/lamp design, noodle, rice, dumpling, shit, cow, orthographic front view,SD(1).jpg",
"folder_1/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a snakeOJ(1).jpg",
"folder_1/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a snakeSD(1).jpg",
"folder_1/lamp in a robotic shape, with no bottom but a touch screen, in a futuristic scenario, movie textureSD.jpg",
"folder_1/lamp lamb lamb lamp lamp lamb lamb lamp hahahaDE(2).jpg",
"folder_1/lamp that could appear in a horror movie, creepy texture and color, with a old-fashioned designDE.jpg",
"folder_1/lamp that has a circled shape, Emits a bright and clear light for visibility in low light conditions, Made out of metal for durability and a modern lookSD.jpg",
"folder_1/lamp that helps blind people to sense light4(1)1MJ.png",
"folder_1/lamp that helps students relax when they are stressed, with rounded shapes that can be placed in different parts of the student house, made out of metalDE.jpg",
"folder_1/lamp that helps students relax when they are stressed, with rounded shapes that can be placed in different parts of the student house, made out of metalSD.jpg",
"folder_1/lamp with a overworld style but with solid functionality, can be driven by people --upbeta4(1)3MJ.png",
"folder_1/lamp with blue color and red lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashOJ.jpg",
"folder_1/lamp with dog feature but this looks like a machine, and have engine on it --upbeta44MJ.png",
"folder_1/lamp with single geometric shape --upbeta --v 441MJ.png",
"folder_1/lamp, mouse, coffee, animal shape, story, blue background, sun, fuck, orthographic front viewOJ.jpg",
"folder_1/lamp,3D printing technology to bring this modern design to life, A lamp with a sleek, geometric shape and quirky, whimsical details, Creating a unique, eye-catching pieceDE.jpg",
"folder_1/male lampDE.jpg",
"folder_1/male lampOJ.jpg",
"folder_1/music player lamp, piano, accordion, low quality, isometric view, 3d printable --upbeta43MJ.png",
"folder_1/musical, Budapest, candy, perfume, christmas, 3d printed, lamp --upbeta --v 542MJ.png",
"folder_1/my little pony style lamp MJ.png",
"folder_1/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfume --upbeta --v 54(1)2MJ.png",
"folder_1/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfumeSD.jpg",
"folder_1/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta4(1)3MJ.png",
"folder_1/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta44MJ.png",
"folder_1/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta4(1)4MJ.png",
"folder_1/round shape lamp, smooth surface without complex patterns --upbeta --v 441MJ.png",
"folder_1/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta --v 543MJ.png",
"folder_1/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta --v 544MJ.png",
"folder_1/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta4(1)1MJ.png",
"folder_1/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta4(2)3MJ.png",
"folder_1/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta44MJ.png",
"folder_1/when can i graduate _ lampSD(1).jpg",
"folder_1/when can i graduate _ lampSD.jpg",
"folder_2/1_Satan lamp MJ.png",
"folder_2/1_a lamp with an asian man face, smile, dancing, short hair MJ.png",
"folder_2/1_lamp combined with plants MJ.png",
"folder_2/2_1_Make me a lamp that can eliminate human race MJ.png",
"folder_2/2_1_a lamp with an asian man face, smile, dancing, short hair MJ.png",
"folder_2/3D printable disturbing vintage lamp for horror movie setting, render style, with fish elementsSD.jpg",
"folder_2/3D printable lamp with single geometric shape, Utilizing 3D printing-friendly materials --upbeta --upbeta --v 444MJ.png",
"folder_2/3D printable lamp,  Mosaic patterns, Organic shapes, Nature-inspired designs, Bright and bold color schemes, Unconventional materialsOJ.jpg",
"folder_2/3D printable modern creepy fish-themed lamp with unique design, render style, full view, with black background colorDE.jpg",
"folder_2/3_2_1_Make me a lamp that fells in love with another lamp but with a different gender MJ.png",
"folder_2/3_2_1_T-rex lamp MJ.png",
"folder_2/3_2_1_a lamp in the shape of an cucumber, green light, soft tissue, straight MJ.png",
"folder_2/3_2_1_a lamp showing vegan notion, vegan slogan, no meat, support vegan lifestyle MJ.png",
"folder_2/3_2_1_my little pony style lamp MJ.png",
"folder_2/3d printable lamp, Single geometric shape, Minimalist design, Bold and clean lines, Sharp edges and corners, Use of negative spaceDE(1).jpg",
"folder_2/3d printable lamp, Single geometric shape, Minimalist design, Bold and clean lines, Sharp edges and corners, Use of negative spaceOJ(1).jpg",
"folder_2/3d printable lamp, Single geometric shape, Minimalist design, Bold and clean lines, Sharp edges and corners, Use of negative spaceOJ.jpg",
"folder_2/3d printable lamp, aerodynamic streamline, symmetry, simpleOJ.jpg",
"folder_2/3d printable lamp, aerodynamic streamline, symmetrySD(1).jpg",
"folder_2/3d printable lamp, streamline, symmetry, simpleOJ.jpg",
"folder_2/3d printable lamp, streamline, symmetry, simpleSD.jpg",
"folder_2/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright pink color that complements the stem, The lamp should be made with 3D-printable materials, render style, full lamp viewOJ.jpg",
"folder_2/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 54(1)1MJ.png",
"folder_2/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 54(2)2MJ.png",
"folder_2/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 543MJ.png",
"folder_2/A cute lamp shaped as a snake made of smooth wood, isometric view,render style, clear background --upbeta --v 543MJ.png",
"folder_2/A cute lamp shaped as a snake made of smooth wood, isometric view,render style, clear background --upbeta --v 544MJ.png",
"folder_2/A lamp design inspired by the unusual and dream-like settings often seen in David Lynch_s movies. The lamp has a mysterious, surreal appearance and can be adjusted to different angles, creating a unique and memorable atmosphereSD.jpg",
"folder_2/A lamp designed specifically for blind users that translates light intensity into vibration, The lamp also emits light for sighted users, but the vibration feature can be used independentlyOJ.jpg",
"folder_2/A lamp inspired by cyberpunk and the aesthetic of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background --upbeta --v 541MJ.png",
"folder_2/A lamp inspired by cyberpunk and the aesthetic of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background --upbeta --v 543MJ.png",
"folder_2/A lamp inspired by the Cthulhu mythos and Starcraft_s Protoss aesthetics, 3d printed2MJ.png",
"folder_2/A lamp inspired by the Cthulhu mythos and Starcraft_s Protoss aesthetics, clear background, 3d printed2MJ.png",
"folder_2/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.SD.jpg",
"folder_2/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics.SD.jpg",
"folder_2/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents.DE(1).jpg",
"folder_2/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring cyberpunk accents.SD.jpg",
"folder_2/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.DE(4).jpg",
"folder_2/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.OJ.jpg",
"folder_2/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.SD(2).jpg",
"folder_2/A lamp inspired by the Tzeentch factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_2/A lamp inspired by the aesthetic of the Qin Dynasty and horror games, full front, render style, orthographic full view of the design from behind, and a solid color background, photorealistic, orthographic views --upbeta --v 544MJ.png",
"folder_2/A lamp inspired by the aesthetics of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_2/A lamp inspired by the mixed aesthetics of Starcraft_s Terran and Protoss factions, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_2/A lamp inspired by traditional Chinese cuisine, such as dumplings, tofu, and other delicacies, featuring intricate details in its design, A sheep-inspired lamp design with soft woolen textures and warm, earthy tonesDE.jpg",
"folder_2/A lamp inspired by traditional Chinese cuisine, such as dumplings, tofu, and other delicacies, featuring intricate details in its design, A sheep-inspired lamp design with soft woolen textures and warm, earthy tonesSD.jpg",
"folder_2/A lamp looks weird and makes you feel in the oceanSD.jpg",
"folder_2/A lamp shaped like a cute snake made of smooth wood, Isometric view, Render style, abstractSD.jpg",
"folder_2/A lamp that has a translucent, dome-shaped shade resembling a jellyfish bell, It has long, trailing tentacles made from fiber-optic cables that emit a soft glow, creating a mesmerizing effectDE.jpg",
"folder_2/A lamp that looks like a panda_s face with black and white color schemeSD.jpg",
"folder_2/A lamp that resembles a hairbrush, with a handle and bristles made from flexible plastic or silicone, It has two brightness settings_ one for bright, functional light when needed and another for a soft, warm glow to create a relaxing ambiance.SD.jpg",
"folder_2/A lamp with a fluffy fur cover that resembles sheep, A lamp with a unique design inspired by the texture of sheep furOJ.jpg",
"folder_2/A lamp with a fluid, organic shape that hints at natural forms, Rendered with bold colors and sharp contrasts to create a striking visual effectSD.jpg",
"folder_2/A lamp with a minimalist design in soft colours and wood materials, with a lampshade made of see-through material, render styleOJ.jpg",
"folder_2/A lamp with a minimalist design in soft colours, with a lampshade made of see-through material, render styleSD.jpg",
"folder_2/A lamp with a minimalist design that resembles an hourglass, The lamp has two different settings - one providing bright light for productivity, and the other providing a warm, soft glow for relaxation and creating a cozy atmosphere.DE.jpg",
"folder_2/A lamp with a multi-colored stained glass lampshade, elegant style, minimalistic colorsSD.jpg",
"folder_2/A lamp with a multi-colored stained glass lampshade, elegant style, minimalisticDE.jpg",
"folder_2/A lamp with a sci-fi-inspired design featuring a metallic finish and minimalist LED structure. The lamp_s sleek design should imply futuristic sophistication, with sharp angles and cutaways that suggest technological advancement.DE(1).jpg",
"folder_2/A lamp with a sci-fi-inspired design featuring a metallic finish and minimalist LED structure. The lamp_s sleek design should imply futuristic sophistication, with sharp angles and cutaways that suggest technological advancement.OJ(1).jpg",
"folder_2/A lamp with a sci-fi-inspired design featuring a metallic finish and minimalist LED structure. The lamp_s sleek design should imply futuristic sophistication, with sharp angles and cutaways that suggest technological advancement.OJ(2).jpg",
"folder_2/A lamp with a sci-fi-inspired design featuring a metallic finish and minimalist LED structure. The lamp_s sleek design should imply futuristic sophistication, with sharp angles and cutaways that suggest technological advancement.SD(1).jpg",
"folder_2/A lamp with a thin green stem and a bright pink tulip head that looks like it_s blossomingSD.jpg",
"folder_2/A lamp with a warm and cozy appearance perfect for a winter night, north Sweden, China red, universe repairment,Zen, budda, Taichi, shitSD.jpg",
"folder_2/A lamp with a warm and cozy wooden-style appearance, incorporating a minimalist and modern concrete element to its design,solid background,render style --upbeta --v 541MJ.png",
"folder_2/A lamp with an articulated arm that can be adjusted into various positions, A lampshade made of glass that changes color depending on the angle of the light, A base made of wood with a carved design resembling a tree trunkOJ.jpg",
"folder_2/A lamp with an irregular, organic shape, reminiscent of a sea creature, two lamps in the same image, render style,veganOJ.jpg",
"folder_2/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 542MJ.png",
"folder_2/A lamp with clean lines and simple shapes, inspired by civil engineering designs, render style, minimalist design --upbeta --v 541MJ.png",
"folder_2/A lamp with clean lines and simple shapes, inspired by civil engineering designs, render style, minimalist design --upbeta --v 543MJ.png",
"folder_2/A lamp with, appearance changing from time to time, inclusive, Apex-style,DE.jpg",
"folder_2/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 54(2)1MJ.png",
"folder_2/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 541MJ.png",
"folder_2/A modern desk lamp with a matte black wooden base and an exposed filament bulb that produces a warm, soft light perfect for readingSD.jpg",
"folder_2/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped top --upbeta --v 54(1)3MJ.png",
"folder_2/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(2)1MJ.png",
"folder_2/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(2)2MJ.png",
"folder_2/A sleek and polished lamp design with a sophisticated touchSD.jpg",
"folder_2/A sleek and polished lamp design with a web touchSD(1).jpg",
"folder_2/A table lamp with a wavy wooden base and a translucent glass shade in the shape of a flowerDE.jpg",
"folder_2/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render styl --upbeta --v 541MJ.png",
"folder_2/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render styl --upbeta --v 544MJ.png",
"folder_2/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(3)2MJ.png",
"folder_2/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth.OJ(1).jpg",
"folder_2/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth2MJ.png",
"folder_2/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth3MJ.png",
"folder_2/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenityDE(2).jpg",
"folder_2/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(1)4MJ.png",
"folder_2/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(2)1MJ.png",
"folder_2/An inviting lamp with, featuring a unique and striking bottom view to provide visual interest, incorporating a minimalist and modern concrete element to its designSD.jpg",
"folder_2/An ocean-inspired table lamp with a wavy blue glass base and a white fabric drum shade that evokes the calming waves of a peaceful seaSD.jpg",
"folder_2/An oil-painted picture of an sleek and elegant lamp with subtle web-inspired detailsOJ.jpg",
"folder_2/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 442MJ.png",
"folder_2/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 443MJ.png",
"folder_2/An oil-painting of an sleek and elegant lamp with subtle web-inspired detailsOJ(2).jpg",
"folder_2/An oil-painting of an sleek and elegant lamp with subtle web-inspired detailsSD.jpg",
"folder_2/An oil-painting style, clear background, no furniture, only an elegant and fancy lamp design with subtle web-inspired structures --upbeta --v 443MJ.png",
"folder_2/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 441MJ.png",
"folder_2/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 443MJ.png",
"folder_2/An oil-painting style, without background, only a elegant and sleek lamp design with subtle web-inspired details --upbeta --v 444MJ.png",
"folder_2/Create a haunting ambiance with eerie shadows, Indulge in your dark fantasies with lamp illumination, Instills a spine-chilling sense of forebodingSD.jpg",
"folder_2/Cthulhu-inspired, cyberpunk, lamp with a slimy ghost-like face, isometric viewpoint.SD.jpg",
"folder_2/Cthulhu-inspired, dagon, lamp with a slimy ghost-like face.SD.jpg",
"folder_2/Cthulhu-inspired, starwar, lamp with a slimy ghost-like face, isometric viewpoint.OJ.jpg",
"folder_2/Design a water-resistant lamp suitable for outdoor use in any weather conditions, Features a rechargeable battery for convenience and portabilityOJ.jpg",
"folder_2/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space --upbeta --v 444MJ.png",
"folder_2/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ(7).jpg",
"folder_2/Futuristic and avant-garde, Unibody 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint3MJ.png",
"folder_2/Glow with an eerie light, Add a ghostly atmosphere to any room, A lamp to give you chillsSD.jpg",
"folder_2/Has light sensitivity that reacts to sound or music to create a dynamic display for festive events, A long lamp with a wooden appearance that is narrow at the bottom and widens towards the top, portableOJ.jpg",
"folder_2/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta --v 543MJ.png",
"folder_2/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation,clear background, isometric view --upbeta --v 544MJ.png",
"folder_2/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta4(1)1MJ.png",
"folder_2/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta41MJ.png",
"folder_2/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view, multi-colour light --upbeta41MJ.png",
"folder_2/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view, multi-colour light --upbeta44MJ.png",
"folder_2/Includes a self-defense tool in case of emergency, Utilizes modern and sleek design elements for aesthetic appeal, Has a dynamic display feature with light sensitivity that reacts to strong soundsSD.jpg",
"folder_2/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.DE(3).jpg",
"folder_2/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.DE.jpg",
"folder_2/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.SD(1).jpg",
"folder_2/Lamp design, Copper lamp base, European-style lampshade, Glass crystal pendant, Hand-carved, Candle-like light bulb, orthographic front view, --upbeta41MJ.png",
"folder_2/Lamp design, Copper lamp base, European-style lampshade, Glass crystal pendant, Hand-carved, Candle-like light bulb, orthographic front view, --upbeta43MJ.png",
"folder_2/Lamp_s minimalist design, Use of sleek materials, Innovative lighting features, Smart technology integration, Unique color schemes, Energy-efficient power sourceSD.jpg",
"folder_2/Large steampunk-style lamp with a wooden-textured porcelain finish, Sleek and shark-like silhouette design for a unique and captivating lookDE.jpg",
"folder_2/Large steampunk-style lamp with a wooden-textured porcelain finish, Sleek and shark-like silhouette design for a unique and captivating lookOJ.jpg",
"folder_2/Make me a lamp that can eliminate human race MJ.png",
"folder_2/QQ email address lamp, Wechat, Whatsapp, isometric view, 3d printable, app design --upbeta43MJ.png",
"folder_2/QQ email address lamp, Wechat, Whatsapp, isometric view, 3d printable, app design --upbeta44MJ.png",
"folder_2/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta4(1)2MJ.png",
"folder_2/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated propotions --upbeta43MJ.png",
"folder_2/Smooth and non-porous porcelain material for easy-to-clean maintenance, blue dimming light, lamp, steampunk, huge, shark-like, wooden feelingDE.jpg",
"folder_2/The lamp_s base is designed to resemble a vintage candlestick holder, classic styleDE.jpg",
"folder_2/The lamp_s base is designed to resemble a vintage candlestick holder, classic styleOJ.jpg",
"folder_2/The lampshade has a 3D-printed image of a T-Rex or other dinosaur, A lamp with a base designed to look like a dinosaur leg or footprint, It features multiple color-changing settings, creating the effect of a colored glow inside the dinosaur figureDE.jpg",
"folder_2/The lampshade is designed to mimic the pattern of plant leaves, adding a fresh and calming ambiance to any spaceDE.jpg",
"folder_2/The lampshade is designed to mimic the pattern of plant leaves, adding a fresh and calming ambiance to any spaceSD.jpg",
"folder_2/Warhammer-inspired lamp with a slimy ghost-like face and robotic accents.SD.jpg",
"folder_2/What flower should the lampshade be shaped like_DE.jpg",
"folder_2/Whimsical design, Artistic structure, Color-changing lighting, Innovative mechanisms, Playful shapes, Interactive lighting, Abstract forms, Exaggerated proportions, Surreal style.SD.jpg",
"folder_2/_A lamp with fluid lines, whose form can be gracefully curved towards the ground for a unique, contemporary look._OJ(1).jpg",
"folder_2/_Mushroom-inspired design, Frosted lampshade, Slim base, Soft glowSD.jpg",
"folder_2/a cute lamp(4).jpg",
"folder_2/a cute lamp(7).jpg",
"folder_2/a lamp design in 3d modelling, greek sculpture and geometricOJ.jpg",
"folder_2/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lights, planetary engine in the film named the wandering earthDE(1).jpg",
"folder_2/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --v 54(1)1MJ.png",
"folder_2/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --v 54(1)3MJ.png",
"folder_2/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPDE(1).jpg",
"folder_2/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPOJ(1).jpg",
"folder_2/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPSD(2).jpg",
"folder_2/a lamp design, 3d modelling, apex legends guns,DE(1).jpg",
"folder_2/a lamp design, 3d modelling, apex legends guns,DE(3).jpg",
"folder_2/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPDE(2).jpg",
"folder_2/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPSD(1).jpg",
"folder_2/a lamp suits for civil engineerDE.jpg",
"folder_2/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 54(1)1MJ.png",
"folder_2/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 54(2)2MJ.png",
"folder_2/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 542MJ.png",
"folder_2/a lamp that has a laberinth that changes colour so children can play while parents are busy, with a rounded shape and water resistant44MJ.png",
"folder_2/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 54(1)4MJ.png",
"folder_2/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion.OJ.jpg",
"folder_2/a lamp, guitar like material with strings on it, combination with plants, a bluetooth speakerSD.jpg",
"folder_2/a lamp, guitar like material with strings on it, combine with plants, can be used like a bluetooth speakerOJ(1).jpg",
"folder_2/adjustable, lamp, playful, automatic, artistic, unique, orthographic viewDE.jpg",
"folder_2/adjustable, lamp, playful, automatic, artistic, unique,OJ.jpg",
"folder_2/ancient scenario, fashionable lamp, egg, calender, flower, orthographic front view, exaggerated propotionsOJ(1).jpg",
"folder_2/clear background, An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception.SD.jpg",
"folder_2/cola, ciber, audio, podcast, anti-sustainable, lamp design --upbeta42MJ.png",
"folder_2/elegant lampDE.jpg",
"folder_2/female lamp with delft university of technology style on itOJ(1).jpg",
"folder_2/lamp design blending the aesthetics of a modern stringed instrument with adjustable lighting elements for a sound and light experienceSD.jpg",
"folder_2/lamp design blending the aesthetics of a modern violin with adjustable lighting elements for a sound and light experience, in a context with it_s playerSD.jpg",
"folder_2/lamp design, Minimalism, Visually striking, Streamlined design, Customization, Refined lighting, Space elevation. And the Chinese translationSD.jpg",
"folder_2/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta --v 544MJ.png",
"folder_2/lamp design, noodle, rice, dumpling, shit, cow, orthographic front view,SD.jpg",
"folder_2/lamp design,wool wall material, cozy feelingDE.jpg",
"folder_2/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a snakeDE(1).jpg",
"folder_2/lamp in a robotic shape, with no bottom but a touch screen, in a futuristic scenario, movie textureOJ.jpg",
"folder_2/lamp lamb lamb lamp lamp lamb lamb lamp hahahaDE.jpg",
"folder_2/lamp lamb lamb lamp lamp lamb lamb lamp hahahaOJ(1).jpg",
"folder_2/lamp made of C60 materials, Inspired by the ancient myths of Middle-earth, designed to look like the WeChat logo from a top-view perspective,solid color background, render style --upbeta --v 543MJ.png",
"folder_2/lamp that helps blind people to sense light41MJ.png",
"folder_2/lamp that helps blind people to sense light43MJ.png",
"folder_2/lamp that helps blind people to sense light44MJ.png",
"folder_2/lamp to decorate the room for dia de muertos43MJ.png",
"folder_2/lamp with blue color and right lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashSD.jpg",
"folder_2/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta4(1)2MJ.png",
"folder_2/lamp, guitar, vegan, city, designer, club --upbeta4(1)2MJ.png",
"folder_2/lamp, guitar, vegan, city, designer, club --upbeta42MJ.png",
"folder_2/make me a lamp that is a collective of all kinds of human limbs MJ.png",
"folder_2/make me a lamp that looks like a warlord MJ.png",
"folder_2/male lamp with delft university of technology style on itDE(1).jpg",
"folder_2/milk, lamp, cartoon, abstract, remote, female, computer, orthographic front view, exaggerated propotionsOJ(1).jpg",
"folder_2/musical, Budapest, candy, perfume, christmas, 3d printed, lamp --upbeta --v 541MJ.png",
"folder_2/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta4(2)2MJ.png",
"folder_2/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta --v 54(1)4MJ.png",
"folder_2/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta --v 543MJ.png",
"folder_2/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta41MJ.png",
"folder_2/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta43MJ.png",
"folder_2/whole-person inspired cute robotic lamp with touch screen and futuristic elementsOJ.jpg",
"folder_3/1980s sci-fi style lamp MJ.png",
"folder_3/1_Make me a lamp that fells in love with another lamp but with a different gender MJ.png",
"folder_3/1_a futuristic metal lamp that looks like something from a sci-fi movie MJ.png",
"folder_3/1_a lamp in the shape of an cucumber, green light, soft tissue, straight MJ.png",
"folder_3/1_a souvenir lamp from the faculty of industrial design and engineering, TUDelft, the Netherlands MJ.png",
"folder_3/1_make me a lamp that looks like a warlord MJ.png",
"folder_3/1_my little pony style lamp MJ.png",
"folder_3/2_1_a vintage-style lamp from the house Gryffindor of Harry Potter MJ.png",
"folder_3/2_1_lamp design for a cat MJ.png",
"folder_3/3D printable lamp with single geometric shape, Utilizing 3D printing-friendly materials --upbeta --v 444MJ.png",
"folder_3/3_2_1_Cthulhu lamp MJ.png",
"folder_3/3_2_1_Make me a lamp that can eliminate human race MJ.png",
"folder_3/3_2_1_a lamp that cast light from a bald man_s head, shining bald head, no hear, funny, creepy MJ.png",
"folder_3/3_2_1_make me a lamp that is a collective of all kinds of human limbs MJ.png",
"folder_3/3d printable lamp, Eclectic mix of materials, Bold and asymmetrical shapes, Unconventional forms, High contrasting colors, Dynamic and expressive patternsOJ.jpg",
"folder_3/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelDE(2).jpg",
"folder_3/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelOJ(1).jpg",
"folder_3/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelOJ(3).jpg",
"folder_3/3d printable lamp, aerodynamic streamline, symmetry, simpleDE.jpg",
"folder_3/3d printable lamp, aerodynamic streamline, symmetry, simpleSD(1).jpg",
"folder_3/3d printable lamp, aerodynamic streamline, symmetry, sun lightDE.jpg",
"folder_3/3d printable lamp, art deco, hand sketchOJ(1).jpg",
"folder_3/3d printable lamp, streamline, symmetry, simple, Intricate filigree details, Baroque style embellishments, Floral motifs, Ornate curves and swirlsSD.jpg",
"folder_3/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright pink color that complements the stem, The lamp should be made with 3D-printable materials, render style, full lamp viewDE.jpg",
"folder_3/A coloful man-shaped shinning lamp design, orthographic front view,DE.jpg",
"folder_3/A cute lamp made of soft, pastel-colored felt material in the shape of an animalOJ.jpg",
"folder_3/A cute lamp made of soft, pastel-colored felt material in the shape of an animalSD.jpg",
"folder_3/A cute lamp made of wood, soft material in the shape of an animalSD.jpg",
"folder_3/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 54(1)3MJ.png",
"folder_3/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 54(2)3MJ.png",
"folder_3/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 54(2)4MJ.png",
"folder_3/A cute lamp shaped as a snake made of smooth wood, isometric view,render style, abstractDE.jpg",
"folder_3/A cute lamp shaped as a snake made of smooth wood, isometric view,render style, abstractOJ.jpg",
"folder_3/A lamp inspired by Dadaism and the aesthetic of the Qin Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_3/A lamp inspired by Donald Trump and Warhammer aesthetics.SD.jpg",
"folder_3/A lamp inspired by TU Delft blue, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.OJ.jpg",
"folder_3/A lamp inspired by TU Delft, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.OJ.jpg",
"folder_3/A lamp inspired by Warhammer 40K aesthetics, isometric viewpoint, clear background, 3d printed3MJ.png",
"folder_3/A lamp inspired by cyberpunk and the aesthetic of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_3/A lamp inspired by the Cthulhu mythos and Starcraft_s Protoss aesthetics, clear background, 3d printed4MJ.png",
"folder_3/A lamp inspired by the Cthulhu mythos and Warhammer 40K aesthetics, 3d printed2MJ.png",
"folder_3/A lamp inspired by the Cthulhu mythos and Warhammer 40K aesthetics, 3d printed4MJ.png",
"folder_3/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics.DE.jpg",
"folder_3/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents.SD.jpg",
"folder_3/A lamp inspired by the Nurgle factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a transparent background, 3d printed3MJ.png",
"folder_3/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.OJ(3).jpg",
"folder_3/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.OJ(4).jpg",
"folder_3/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed4MJ.png",
"folder_3/A lamp inspired by the Tzeentch factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_3/A lamp inspired by the aesthetics of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_3/A lamp inspired by the mixed aesthetics of Deus Ex and the armies in Ming Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_3/A lamp inspired by the mixed aesthetics of Deus Ex and the armies in Ming Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_3/A lamp inspired by the slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a transparent background, 3d printed4MJ.png",
"folder_3/A lamp that looks like a panda_s face with black and white color schemeOJ.jpg",
"folder_3/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical piece, cold lightSD.jpg",
"folder_3/A lamp with a fluffy fur cover that resembles sheep, A lamp with a unique design inspired by the texture of sheep furDE.jpg",
"folder_3/A lamp with a geometrically shaped lampshade in black and white patterns, like pandaDE.jpg",
"folder_3/A lamp with a minimalist design in white and black colors, with a lampshade made of see-through material, render styleDE.jpg",
"folder_3/A lamp with a minimalist design in white and black colors, with a lampshade made of see-through materialDE.jpg",
"folder_3/A lamp with a spider-like appearance, Inspired by Dyson design, Utilizes functional minimalismDE.jpg",
"folder_3/A lamp with a spider-like appearance, Inspired by Dyson design, Utilizes functional minimalismOJ.jpg",
"folder_3/A lamp with a spider-like appearance, Inspired by Dyson design, Utilizes functional minimalismSD.jpg",
"folder_3/A lamp with a spider-like appearance, Inspired by Dyson designOJ.jpg",
"folder_3/A lamp with an irregular, organic shape, reminiscent of a sea creature, two lamps in the same image, render style,veganDE.jpg",
"folder_3/A lamp with, designed to emit a soft glow, made from recycled materials, minimalist, eco-friendly design, featuring a woven or macrame%C3%8C -style lampshadeOJ.jpg",
"folder_3/A sculptural lamp with an organic, flowing design, A minimalist lamp with geometric, angular features, A playful lamp with a whimsical, eye-catching appearanceOJ.jpg",
"folder_3/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped top --upbeta --v 541MJ.png",
"folder_3/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped top --upbeta --v 543MJ.png",
"folder_3/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(1)4MJ.png",
"folder_3/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(2)3MJ.png",
"folder_3/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 543MJ.png",
"folder_3/A sleek and polished lamp design with a sophisticated touchOJ.jpg",
"folder_3/A sleek and polished lamp design with a web touchDE(1).jpg",
"folder_3/A sleek and polished lamp design with a web touchOJ(1).jpg",
"folder_3/A sleek and polished lamp design with a web touchOJ.jpg",
"folder_3/A sleek, morden and polished lamp design with a web touchDE.jpg",
"folder_3/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenityOJ(1).jpg",
"folder_3/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenitySD(1).jpg",
"folder_3/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenitySD.jpg",
"folder_3/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(2)2MJ.png",
"folder_3/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta41MJ.png",
"folder_3/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 44(1)4MJ.png",
"folder_3/An oil-painting inspired lamp design with subtle web-inspired details, A lamp with an oil-painting style featuring delicate web elements, A lamp design inspired by oil-painting with elegant web-inspired accentsOJ(1).jpg",
"folder_3/An oil-painting inspired lamp design with subtle web-inspired details, A lamp with an oil-painting style featuring delicate web elements, A lamp design inspired by oil-painting with elegant web-inspired accentsOJ(2).jpg",
"folder_3/An oil-painting inspired lamp design with subtle web-inspired detailsOJ.jpg",
"folder_3/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 44(1)1MJ.png",
"folder_3/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 44(2)1MJ.png",
"folder_3/An oil-painting style, elegant and sleek lamp design with subtle web-inspired details --upbeta --v 443MJ.png",
"folder_3/Copper lamp base - European-style lampshade, Glass crystal pendant, Hand-carved - Candle-like light bulborthographic front view,SD.jpg",
"folder_3/Craft a unique lamp, inspired by the beautiful and organic form of a sea urchin, to add a touch of intrigue and natural elegance to your space --upbeta --v 444MJ.png",
"folder_3/Cthulhu-inspired, cyberpunk, lamp with a slimy ghost-like face, isometric viewpoint, 3d printable.DE.jpg",
"folder_3/Cthulhu-inspired, dagon, lamp with a slimy ghost-like face, isometric viewpoint.DE.jpg",
"folder_3/Cthulhu-inspired, ghost shell, lamp with a slimy ghost-like face, isometric viewpoint.SD.jpg",
"folder_3/Cybernetic mechanisms, dancing lamp, emotional, orthographic front viewSD(1).jpg",
"folder_3/Cylindrical-shaped lamp with a soft and fluffy wool fabric finishSD.jpg",
"folder_3/Design a lamp that projects warm, color-changing light in various shapes for displaying photosDE.jpg",
"folder_3/Design a small and compact waterproof 3D-printable lamp that is suitable for travelSD.jpg",
"folder_3/Discover elegant lamp designs that accentuate any space, Unleash the creativity in you with the latest lamp designs, Elevate your decor game with innovative lamp designsOJ.jpg",
"folder_3/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space --upbeta --v 441MJ.png",
"folder_3/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE(5).jpg",
"folder_3/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE.jpg",
"folder_3/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ.jpg",
"folder_3/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD(6).jpg",
"folder_3/Futuristic and avant-garde, Unibody 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint2MJ.png",
"folder_3/Geometric 3D lamp, Simple yet functional design, Monochromatic color palette, Minimalist aesthetic, Emphasis on form and structure, Use of 3D printing-friendly materialsOJ.jpg",
"folder_3/Has light sensitivity that reacts to sound or music to create a dynamic display for festive events, A long lamp with a wooden appearance that is narrow at the bottom and widens towards the top, portableSD.jpg",
"folder_3/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta4(1)2MJ.png",
"folder_3/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation,clear background, isometric view --upbeta42MJ.png",
"folder_3/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta44MJ.png",
"folder_3/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization,clear background --upbeta41MJ.png",
"folder_3/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization,clear background --upbeta44MJ.png",
"folder_3/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view, multi-colour light --upbeta42MJ.png",
"folder_3/Includes a self-defense tool in case of emergency, Utilizes modern and sleek design elements for aesthetic appeal, Has a dynamic display feature with light sensitivity that reacts to strong soundsOJ.jpg",
"folder_3/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.SD(2).jpg",
"folder_3/Integrated blue dimming light for adjustable illumination levelsOJ.jpg",
"folder_3/Integrated blue dimming light for adjustable illumination levelsSD.jpg",
"folder_3/It has a dimming feature that can be controlled via a mobile appDE.jpg",
"folder_3/Lamp design, Copper lamp base, European-style lampshade, Glass crystal pendant, Hand-carved, Candle-like light bulb, ographic front view,OJ.jpg",
"folder_3/Lamp design, Copper lamp base, European-style lampshade, Glass crystal pendant, Hand-carved, Candle-like light bulb, orthographic front view, --upbeta42MJ.png",
"folder_3/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated propotions --upbeta41MJ.png",
"folder_3/Sleek lamp designOJ.jpg",
"folder_3/Smooth and non-porous porcelain material for easy-to-clean maintenance, blue dimming light, lamp, steampunk, huge, shark-like, wooden feelingOJ.jpg",
"folder_3/Sophisticated lamp featuring a simple yet elegant style.DE.jpg",
"folder_3/The lamp_s base is designed to resemble a vintage candlestick holder, classic styleSD.jpg",
"folder_3/The lamp_s brightness and color can be easily adjusted by tapping the lamp_s surface, This lamp plugs in via USB or wall outlet, ensuring continuous operation and suitable for all solid color backgroundsOJ.jpg",
"folder_3/Unibody 3D printable lamp with a minimalist Muji design style, a bold red cable, simple texture, dynamic render style, and isometric viewpoint2MJ.png",
"folder_3/Unibody 3D printable lamp with a minimalist Muji design style, a bold red cable, simple texture, dynamic render style, and isometric viewpoint4MJ.png",
"folder_3/Warhammer-inspired lamp with a slimy ghost-like face and robotic accents.SD(1).jpg",
"folder_3/_A lamp with fluid lines, whose form can be gracefully curved towards the ground for a unique, contemporary look._OJ(3).jpg",
"folder_3/_A minimalist lamp with a sleek, modular design that can be easily reconfigured to suit various settings and moods, as it delivers elegant, understated lightingDE(1).jpg",
"folder_3/_Streamlined 3D printable Art Deco lamp with geometric shapes and silver accents,_ _Castable lamp design with symmetrical angular body and vivid color scheme._SD.jpg",
"folder_3/a apple lamp, cute, soft, warm light, tragicSD.jpg",
"folder_3/a cute lamp(6).jpg",
"folder_3/a lamp design in 3d modelling, greek sculpture and geometricDE.jpg",
"folder_3/a lamp design in 3d modelling, greek sculpture and geometricSD.jpg",
"folder_3/a lamp design with greek sculpture and geometricSD.jpg",
"folder_3/a lamp design, 3d modelling render, game terraria, FULL LAMPDE(1).jpg",
"folder_3/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --v 54(1)2MJ.png",
"folder_3/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta44MJ.png",
"folder_3/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPDE(2).jpg",
"folder_3/a lamp design, 3d modelling, apex legends guns, FULL LAMPDE(2).jpg",
"folder_3/a lamp design, 3d modelling, apex legends guns, FULL LAMPOJ(1).jpg",
"folder_3/a lamp design, 3d modelling, apex legends guns,OJ(2).jpg",
"folder_3/a lamp design, 3d modelling, apex legends guns,OJ.jpg",
"folder_3/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPOJ(2).jpg",
"folder_3/a lamp design, greek sculpture and geometricOJ.jpg",
"folder_3/a lamp suits for civil engineerSD.jpg",
"folder_3/a lamp that has a laberinth that changes colour so children can play while parents are busy, with a rounded shape and water resistant41MJ.png",
"folder_3/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 54(1)2MJ.png",
"folder_3/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 541MJ.png",
"folder_3/a souvenir lamp from the faculty of industrial design and engineering, TUDelft, the Netherlands MJ.png",
"folder_3/champion shirt lamp, big brand, LV, Gucci, Prada, isometric view, Chanel, 3d printable --upbeta44MJ.png",
"folder_3/cola, ciber, audio, podcast, anti-sustainable, lamp design --upbeta43MJ.png",
"folder_3/creepy fish-themed lamp with a modern twist and unique designSD.jpg",
"folder_3/cute, natural, lamp, fashion,transparent, coloful, Unique shapeDE(1).jpg",
"folder_3/cute, natural, lamp, fashion,transparent, coloful, Unique shapeSD(1).jpg",
"folder_3/elegant lampOJ(1).jpg",
"folder_3/flying dog lamp, jewellery, grammerly, chatgpt, isometric view, 3d printable --upbeta42MJ.png",
"folder_3/frightening fish-inspired lamp for chilling atmosphere and modern appealSD.jpg",
"folder_3/full female lampSD.jpg",
"folder_3/full male lampOJ.jpg",
"folder_3/full male lampSD.jpg",
"folder_3/lamp design inspired by musical instruments combining sleek shapes with functional lighting elements, a lamp that could be used as an instrumentDE.jpg",
"folder_3/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta --v 541MJ.png",
"folder_3/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta4(1)3MJ.png",
"folder_3/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta4(2)3MJ.png",
"folder_3/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta44MJ.png",
"folder_3/lamp design,wool wall material, cozy feelingOJ.jpg",
"folder_3/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a chinese,full lamp view,SD.jpg",
"folder_3/lamp for a reading corner MJ.png",
"folder_3/lamp lamb lamb lamp lamp lamb lamb lamp hahahaSD(1).jpg",
"folder_3/lamp lamb lamb lamp lamp lamb lamb lamp hahahaSD.jpg",
"folder_3/lamp that could appear in a horror movie, creepy texture and color, with a old-fashioned designSD.jpg",
"folder_3/lamp that helps moms to indicate when their baby formula is ready, with music and aesthetic shape44MJ.png",
"folder_3/lamp with a overworld style but with solid functionality, can be driven by people --upbeta4(1)2MJ.png",
"folder_3/lamp with a overworld style but with solid functionality, can be driven by people --upbeta44MJ.png",
"folder_3/lamp with dog feature but this looks like a machine, and have engine on it --upbeta43MJ.png",
"folder_3/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta --v 542MJ.png",
"folder_3/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta44MJ.png",
"folder_3/lamp,  onenight stand, tabacco, delft, smoke, orthographic front view, exaggerated propotionsDE.jpg",
"folder_3/lamp,  onenight stand, tabacco, delft, smoke, orthographic front view, exaggerated propotionsSD.jpg",
"folder_3/lamp, guitar, vegan, city, designer, club --upbeta4(1)3MJ.png",
"folder_3/male lamp with delft university of technology style on itDE(2).jpg",
"folder_3/male lamp with delft university of technology style on itSD(1).jpg",
"folder_3/male lampSD.jpg",
"folder_3/minimalist yet captivating mountain-inspired lamp with unique silhouette, render styleSD.jpg",
"folder_3/music player lamp, piano, accordion, low quality, isometric view, 3d printable --upbeta44MJ.png",
"folder_3/musical, Budapest, candy, perfume, christmas, 3d printed, lamp --upbeta42MJ.png",
"folder_3/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta --v 542MJ.png",
"folder_3/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta --v 543MJ.png",
"folder_3/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta --v 544MJ.png",
"folder_3/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta4(1)2MJ.png",
"folder_3/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta --v 54(1)1MJ.png",
"folder_3/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta41MJ.png",
"folder_3/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta42MJ.png",
"folder_3/soft loud major moderate lamp, yellow white pink rainbow, isometric view, 3d printable --upbeta --v 542MJ.png",
"folder_3/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta --v 544MJ.png",
"folder_3/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta4(1)2MJ.png",
"folder_3/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta42MJ.png",
"folder_3/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta4(1)3MJ.png",
"folder_4/1_Make me a lamp that looks like a lamp MJ.png",
"folder_4/1_a lamp from the brand Apple which has its typical design characteristics MJ.png",
"folder_4/2_1_Make me a lamp that looks like a lamp MJ.png",
"folder_4/2_1_a lamp in the shape of an cucumber, green light, soft tissue, straight MJ.png",
"folder_4/2_1_a lamp of seven man dancing on it, paper material, with a base, colorful, chinese style MJ.png",
"folder_4/2_1_lamp attached to the headboard of the bed MJ.png",
"folder_4/2_1_make me a heterosexual lamp MJ.png",
"folder_4/2_1_make me a lamp that is a collective of human hands with eyes in the palm growing like a tree MJ.png",
"folder_4/3D printable lamp with single geometric shape, Utilizing 3D printing-friendly materials --upbeta --upbeta --v 441MJ.png",
"folder_4/3D printable lamp, GaudiDE.jpg",
"folder_4/3D printable lamp, Mosaic patterns, Organic shapes, Nature-inspired designs, Bright and bold color schemes, Unconventional materials, GaudiSD.jpg",
"folder_4/3_2_1_Satan lamp MJ.png",
"folder_4/3_2_1_a souvenir lamp from the faculty of industrial design and engineering, TUDelft, the Netherlands MJ.png",
"folder_4/3_2_1_a vintage-style lamp from the house Gryffindor of Harry Potter MJ.png",
"folder_4/3_2_1_lamp attached to the headboard of the bed MJ.png",
"folder_4/3_2_1_lamp combined with plants MJ.png",
"folder_4/3_2_1_make me a lamp that looks like a warlord MJ.png",
"folder_4/3d printable lamp, Single geometric shape, Minimalist design, Bold and clean lines, Sharp edges and corners, Use of negative spaceSD.jpg",
"folder_4/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelOJ(5).jpg",
"folder_4/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelSD(1).jpg",
"folder_4/3d printable lamp, aerodynamic streamline, symmetryOJ.jpg",
"folder_4/3d printable lamp, streamline, symmetry, simple, Intricate filigree details, Baroque style embellishments, Floral motifs, Ornate curves and swirlsDE(1).jpg",
"folder_4/3d printable lamp, streamline, symmetry, simpleDE.jpg",
"folder_4/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright color that complements the stem, The lamp should be made with 3D-printable materials, render style, full lamp viewDE.jpg",
"folder_4/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright pink color that complements the stem, The lamp should be made with 3D-printable materialsSD.jpg",
"folder_4/A contemporary lamp design with a sleek and polished look and web-inspired elementsDE.jpg",
"folder_4/A cute lamp shaped as a snake made of smooth wood, isometric viewDE.jpg",
"folder_4/A lamp could be used as a candleDE.jpg",
"folder_4/A lamp could be used as a candleSD.jpg",
"folder_4/A lamp design inspired by the unusual and dream-like settings often seen in David Lynch_s movies. The lamp has a mysterious, surreal appearance and can be adjusted to different angles, creating a unique and memorable atmosphereOJ.jpg",
"folder_4/A lamp designed to celebrate Día de Muertos with a unique and colorful aesthetic, Features different color emission options for variety in lighting, Has light sensitivity that reacts to sound or music to create a dynamic display for festive eventsDE.jpg",
"folder_4/A lamp handmade from natural materials to create a rustic, earthy aesthetic. The lamp should be crafted from materials such as wood, stone, or natural fibers, and feature a design inspired by the organic shapes found in nature.DE.jpg",
"folder_4/A lamp inspired by Dadaism and the aesthetic of the Qin Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_4/A lamp inspired by TU Delft, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.DE.jpg",
"folder_4/A lamp inspired by cyberpunk and the aesthetic of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background --upbeta --v 542MJ.png",
"folder_4/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents, Donald Trump.OJ.jpg",
"folder_4/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents.SD(1).jpg",
"folder_4/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring the idea of making America great again.DE.jpg",
"folder_4/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring the idea of making America great again.SD.jpg",
"folder_4/A lamp inspired by the Nurgle factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a transparent background, 3d printed1MJ.png",
"folder_4/A lamp inspired by the aesthetic of the Qin Dynasty and horror games, full front, render style, orthographic full view of the design from behind, and a solid color background, photorealistic, orthographic views --upbeta --v 541MJ.png",
"folder_4/A lamp inspired by the aesthetics of Journey to the West, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_4/A lamp inspired by the aesthetics of Journey to the West, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_4/A lamp inspired by the aesthetics of Journey to the West, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_4/A lamp inspired by the choas factions in Warhammer 40K aesthetics, isometric viewpoint, full front, orthographic full view of the design from behind, and a transparent background, 3d printed1MJ.png",
"folder_4/A lamp inspired by the choas factions in Warhammer 40K aesthetics, isometric viewpoint, full front, orthographic full view of the design from behind, and a transparent background, 3d printed4MJ.png",
"folder_4/A lamp shaped like a cute snake made of smooth wood, Isometric view, Render style, abstractOJ.jpg",
"folder_4/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical pieceSD.jpg",
"folder_4/A lamp that stands at approximately 3 feet tall, with a flat circular base, The lamp emits a bright white light and can be dimmed to create a more subdued ambiance.OJ.jpg",
"folder_4/A lamp with a geometric design, A lamp that plays nature soundsOJ.jpg",
"folder_4/A lamp with a geometrically shaped lampshade in black and white patternsSD.jpg",
"folder_4/A lamp with a multi-colored stained glass lampshade, elegant style, minimalistic colors, no bright colourOJ.jpg",
"folder_4/A lamp with a multi-colored stained glass lampshade, elegant style, minimalisticSD.jpg",
"folder_4/A lamp with a sci-fi-inspired design featuring a metallic finish and minimalist LED structure. The lamp_s sleek design should imply futuristic sophistication, with sharp angles and cutaways that suggest technological advancement.OJ.jpg",
"folder_4/A lamp with a thin green stem and a bright pink tulip head that looks like it_s blossomingOJ.jpg",
"folder_4/A lamp with a warm and cozy appearance perfect for a winter night, north Sweden, China red, universe repairment,Zen, budda, Taichi, shitSD(1).jpg",
"folder_4/A lamp with an irregular, organic shape, reminiscent of a sea creature, two lamps in the same image, render styleSD.jpg",
"folder_4/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist designSD.jpg",
"folder_4/A lamp with, designed to emit a soft glow, made from recycled materials, minimalist, eco-friendly design, featuring a woven or macrame%C3%8C_-style lampshadeDE.jpg",
"folder_4/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 54(1)1MJ.png",
"folder_4/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 54(2)3MJ.png",
"folder_4/A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glow, clear background, render styleDE.jpg",
"folder_4/A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glow, clear backgroundDE.jpg",
"folder_4/A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glow, clear backgroundOJ.jpg",
"folder_4/A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glow, clear backgroundSD.jpg",
"folder_4/A simple design that features a wooden base and a soft lighting sourceSD(1).jpg",
"folder_4/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped topOJ.jpg",
"folder_4/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped topSD.jpg",
"folder_4/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(1)3MJ.png",
"folder_4/A sleek and polished lamp design with a web style touchDE.jpg",
"folder_4/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(1)4MJ.png",
"folder_4/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(2)1MJ.png",
"folder_4/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(3)1MJ.png",
"folder_4/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(4)3MJ.png",
"folder_4/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 541MJ.png",
"folder_4/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 544MJ.png",
"folder_4/An elegant table lamp with a smooth, polished wood base and a soft, diffused light that_s perfect for creating a cozy atmosphere, A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glowDE.jpg",
"folder_4/An elegant table lamp with a smooth, polished wood base and a soft, diffused light that_s perfect for creating a cozy atmosphere, A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glowOJ.jpg",
"folder_4/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(1)3MJ.png",
"folder_4/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 44(1)1MJ.png",
"folder_4/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 44(1)2MJ.png",
"folder_4/An oil-painting inspired lamp design with subtle web-inspired details, A lamp with an oil-painting style featuring delicate web elements, A lamp design inspired by oil-painting with elegant web-inspired accentsSD(2).jpg",
"folder_4/An oil-painting inspired lamp design with subtle web-inspired details, A lamp with an oil-painting style featuring delicate web elements, A lamp design inspired by oil-painting with elegant web-inspired accentsSD.jpg",
"folder_4/An oil-painting inspired lamp design with subtle web-inspired detailsSD.jpg",
"folder_4/An oil-painting style, clear background, no furniture, only an elegant and fancy lamp design with subtle web-inspired structures --upbeta --v 441MJ.png",
"folder_4/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 44(2)4MJ.png",
"folder_4/An oil-painting style, without background, only a elegant and sleek lamp design with subtle web-inspired details --upbeta --v 441MJ.png",
"folder_4/Clear image, Lamp_s shape, Lamp_s base color, Lamp_s dimensions, Lamp_s lighting properties, Lamp_s power sourceOJ.jpg",
"folder_4/Copper lamp base - European-style lampshade, Glass crystal pendant, Hand-carved - Candle-like light bulborthographic front view,DE.jpg",
"folder_4/Create a modern and stylish lamp that incorporates geometric shapes and a mixture of colors in the design.OJ.jpg",
"folder_4/Cthulhu-inspired, dagon, lamp with a slimy ghost-like face, isometric viewpoint.OJ.jpg",
"folder_4/Cthulhu-inspired, dagon, lamp with a slimy ghost-like face.DE.jpg",
"folder_4/Cthulhu-inspired, dagon, lamp with a slimy ghost-like face.OJ.jpg",
"folder_4/Cthulhu-inspired, ghost shell, lamp with a slimy ghost-like face, isometric viewpoint.OJ.jpg",
"folder_4/Design a lamp inspired by the shape and structure of a tree, with a sleek and minimalistic design that mimics its branches and leaves. The lamp should use energy-efficient LED bulbs that give off a natural warm glow.DE.jpg",
"folder_4/Design a lamp that projects warm, color-changing light in various shapes for displaying photosSD.jpg",
"folder_4/Each tentacle of the lamp can be adjusted to direct light in different directions, A lampshade made of frosted glass that diffuses light for a soft, ambient glowDE.jpg",
"folder_4/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space --upbeta --v 443MJ.png",
"folder_4/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE(1).jpg",
"folder_4/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE(4).jpg",
"folder_4/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ(1).jpg",
"folder_4/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ(3).jpg",
"folder_4/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD(8).jpg",
"folder_4/Glow with an eerie light, Add a ghostly atmosphere to any room, A lamp to give you chillsDE.jpg",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta --v 541MJ.png",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta --v 544MJ.png",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta4(1)1MJ.png",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta4(1)4MJ.png",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation,clear background, isometric view --upbeta --v 541MJ.png",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta4(2)1MJ.png",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta43MJ.png",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization,clear background --upbeta43MJ.png",
"folder_4/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta43MJ.png",
"folder_4/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.DE(1).jpg",
"folder_4/Lamp, slimy ghost-like face with robotic accents.OJ.jpg",
"folder_4/Let the peaceful and gentle aura of Lapras inspire a soothing and elegant lamp design, evoking memories of adventure and serenity in your living space --upbeta --v 442MJ.png",
"folder_4/QQ email address lamp, Wechat, Whatsapp, isometric view, 3d printable, app design --upbeta42MJ.png",
"folder_4/Smooth and non-porous porcelain material for easy-to-clean maintenance,blue dimming light, steampunk, huge, dolphin-likeSD.jpg",
"folder_4/T-rex lamp MJ.png",
"folder_4/The lamp also emits light for sighted users, but the vibration feature can be used independently, Includes a self-defense tool in case of emergency, Utilizes modern and sleek design elements for aesthetic appealOJ.jpg",
"folder_4/The lamp_s brightness and color can be easily adjusted by tapping the lamp_s surface, This lamp plugs in via USB or wall outlet, ensuring continuous operation and suitable for all solid color backgroundsDE.jpg",
"folder_4/Unibody 3D printable lamp with a minimalist Muji design style, a bold red cable, simple texture, dynamic render style, and isometric viewpoint3MJ.png",
"folder_4/Warcraft-inspired lamp with a slimy ghost-like face and robotic accents.OJ.jpg",
"folder_4/a apple lamp, cute, soft, warm light, tragicDE.jpg",
"folder_4/a lamp design in 3d modelling, greek sculpture and geometricDE(1).jpg",
"folder_4/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lights, planetary engine in the film named the wandering earthOJ.jpg",
"folder_4/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsDE(1).jpg",
"folder_4/a lamp design, 3d modelling render, game terraria, FULL LAMPOJ.jpg",
"folder_4/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPDE(2).jpg",
"folder_4/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPSD.jpg",
"folder_4/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --upbeta --v 541MJ.png",
"folder_4/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --v 543MJ.png",
"folder_4/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPOJ(2).jpg",
"folder_4/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPOJ.jpg",
"folder_4/a lamp design, 3d modelling, apex legends guns, FULL LAMPOJ(2).jpg",
"folder_4/a lamp design, 3d modelling, apex legends guns, FULL LAMPSD(2).jpg",
"folder_4/a lamp design, 3d modelling, apex legends guns,SD(2).jpg",
"folder_4/a lamp design, 3d modelling, oxygen not included style, FULL LAMPSD.jpg",
"folder_4/a lamp design, guitar like material with strings on it, combination with plants, a bluetooth speakerDE.jpg",
"folder_4/a lamp in the shape of an cucumber, green light, soft tissue, straight MJ.png",
"folder_4/a lamp suits for civil engineerOJ.jpg",
"folder_4/a lamp that cast light from a bald man_s head, shining bald head, no hear, funny, creepy MJ.png",
"folder_4/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 54(1)2MJ.png",
"folder_4/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 54(2)1MJ.png",
"folder_4/a lamp that is suitable for a indoor tennis court MJ.png",
"folder_4/a lamp with an asian man face, smile, dancing, short hair MJ.png",
"folder_4/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 54(2)3MJ.png",
"folder_4/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 544MJ.png",
"folder_4/a lamp, guitar like material with strings on it, combination with plants, a bluetooth speakerDE.jpg",
"folder_4/a lamp, guitar like material with strings on it, combine with plants, can be used like a bluetooth speakerDE(1).jpg",
"folder_4/a lamp, guitar like material with strings on it, combine with plants, can be used like a bluetooth speakerSD(1).jpg",
"folder_4/a topology industry style metal lamp with futuristic and a mystical lightSD.jpg",
"folder_4/adjustable, lamp, playful, automatic, artistic, unique, orthographic view, 3D print --upbeta42MJ.png",
"folder_4/cola, ciber, audio, podcast, anti-sustainable, lamp design --upbeta41MJ.png",
"folder_4/cola, ciber, audio, podcast, anti-sustainable, lamp design --upbeta44MJ.png",
"folder_4/cute, natural, lamp, fashion,transparent, coloful, Unique shapeSD.jpg",
"folder_4/elegant lampDE(1).jpg",
"folder_4/elegant lampSD.jpg",
"folder_4/female lamp with delft university of technology style on itOJ.jpg",
"folder_4/frightening fish-inspired lamp for chilling atmosphere and modern appealDE.jpg",
"folder_4/lamp design blending the aesthetics of a modern stringed instrument with adjustable lighting elements for a sound and light experienceOJ.jpg",
"folder_4/lamp design combining a classic toy-inspired appearance vibrant buttons and a vintage twist for interactive funSD.jpg",
"folder_4/lamp design featuring a minimalist futuristic cyber-punk style and touch-sensitive controls embedded in the base for easy brightness adjustment%C3%AF%C2%BC_optimal light, home environment, with oil-painting textureSD.jpg",
"folder_4/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta --upbeta --v 542MJ.png",
"folder_4/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta4(2)1MJ.png",
"folder_4/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta43MJ.png",
"folder_4/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a chinese,full lamp view,OJ.jpg",
"folder_4/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a snakeDE.jpg",
"folder_4/lamp that could appear in Tom and Jerry, full view, render style, cute shape, white backgroundSD.jpg",
"folder_4/lamp that could appear in a horror movie, creepy texture and color, with a old-fashioned designOJ.jpg",
"folder_4/lamp that has a circled shape, Emits a bright and clear light for visibility in low light conditions, Made out of metal for durability and a modern lookDE.jpg",
"folder_4/lamp that projects photos with a warm color that changes shape according to the memoryDE.jpg",
"folder_4/lamp that projects photos with a warm color that changes shape according to the memoryOJ.jpg",
"folder_4/lamp to decorate the room for dia de muertos41MJ.png",
"folder_4/lamp with a overworld style but with solid functionality, can be driven by people --upbeta42MJ.png",
"folder_4/lamp with blue color and red lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashDE(1).jpg",
"folder_4/lamp with blue color and red lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashDE.jpg",
"folder_4/lamp with blue color and red lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashSD(1).jpg",
"folder_4/lamp with blue color and red lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashSD(2).jpg",
"folder_4/lamp with dog feature but this looks like a machine, and have engine on it --upbeta42MJ.png",
"folder_4/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta --v 541MJ.png",
"folder_4/lamp with single geometric shape --upbeta --v 442MJ.png",
"folder_4/lamp with single geometric shape --upbeta --v 443MJ.png",
"folder_4/lamp,  google, tudelft, coop, image, aggressive, orthographic front viewOJ.jpg",
"folder_4/lamp,  google, tudelft, coop, image, aggressive, orthographic front viewSD.jpg",
"folder_4/lamp,  onenight stand, tabacco, delft, smoke, orthographic front view, exaggerated propotionsOJ.jpg",
"folder_4/lamp, Organic shapes, Earthy tones, Geometric patterns, Bohemian style, Vintage inspiration, Scandinavian design, Coastal vibes, Minimalist aesthetic.orthographic front viewDE(1).jpg",
"folder_4/lamp, Organic shapes, Earthy tones, Geometric patterns, Bohemian style, Vintage inspiration, Scandinavian design, Coastal vibes, Minimalist aesthetic.orthographic front viewSD.jpg",
"folder_4/make me a lamp that is a collective of human hands with eyes in the palm growing like a tree MJ.png",
"folder_4/male lamp with delft university of technology style on itOJ(2).jpg",
"folder_4/male lamp with delft university of technology style on itSD(2).jpg",
"folder_4/male lamp with delft university of technology style on itSD.jpg",
"folder_4/only lamp design, Minimalism, Visually striking, Streamlined design, Customization, Refined lighting, Space elevation. And the Chinese translationOJ.jpg",
"folder_4/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta4(1)1MJ.png",
"folder_4/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta43MJ.png",
"folder_4/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta4(1)3MJ.png",
"folder_4/round shape lamp, smooth surface without complex patterns --upbeta --v 44(1)4MJ.png",
"folder_4/round shape lamp, smooth surface without complex patterns --upbeta --v 444MJ.png",
"folder_4/soft loud major moderate lamp, yellow white pink rainbow, isometric view, 3d printable --upbeta42MJ.png",
"folder_4/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta --v 54(1)1MJ.png",
"folder_5/1_make me a lamp that is a collective of all kinds of human limbs MJ.png",
"folder_5/2_1_Satan lamp MJ.png",
"folder_5/2_1_T-rex lamp MJ.png",
"folder_5/2_1_make me a lamp that looks like a warlord MJ.png",
"folder_5/3D printable lamp with single geometric shape, Utilizing 3D printing-friendly materials --upbeta --upbeta --v 442MJ.png",
"folder_5/3D printable lamp with single geometric shape, Utilizing 3D printing-friendly materials --upbeta --v 441MJ.png",
"folder_5/3D printable lamp with single geometric shape, Utilizing 3D printing-friendly materials --upbeta --v 442MJ.png",
"folder_5/3D printable lamp, Gaudi, Curving shapes and lines, Whimsical and playful design elements, Inspired by natural forms and patterns, Mosaic tile embellishments, Use of bold and unique colors, Geometric shapes and patternsDE.jpg",
"folder_5/3D printable lamp, Gaudi, Curving shapes and lines, Whimsical and playful design elements, Inspired by natural forms and patterns, Mosaic tile embellishments, Use of bold and unique colors, Geometric shapes and patternsSD(1).jpg",
"folder_5/3D printable lamp, GaudiSD.jpg",
"folder_5/3D printable lamp, Mosaic patterns, Organic shapes, Nature-inspired designs, Bright and bold color schemes, Unconventional materials, GaudiDE.jpg",
"folder_5/3_2_1_Make me a lamp that can make everyone else unhappy except me MJ.png",
"folder_5/3_2_1_a lamp of seven man dancing on it, paper material, with a base, colorful, chinese style MJ.png",
"folder_5/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelDE(4).jpg",
"folder_5/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelOJ.jpg",
"folder_5/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelSD(2).jpg",
"folder_5/3d printable lamp, aerodynamic streamline, symmetry, simpleSD.jpg",
"folder_5/3d printable lamp, aerodynamic streamline, symmetry, sun lightOJ.jpg",
"folder_5/3d printable lamp, aerodynamic streamline, symmetry, sun lightSD(1).jpg",
"folder_5/3d printable lamp, art deco, hand sketchOJ.jpg",
"folder_5/3d printable lamp, art deco, hand sketchSD(1).jpg",
"folder_5/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright pink color that complements the stem, The lamp should be made with 3D-printable materials, render style, full lamp viewSD.jpg",
"folder_5/A brightly colored tulip-shaped lamp with a slender stemSD.jpg",
"folder_5/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 54(2)1MJ.png",
"folder_5/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 542MJ.png",
"folder_5/A lamp handmade from natural materials to create a rustic, earthy aesthetic. The lamp should be crafted from materials such as wood, stone, or natural fibers, and feature a design inspired by the organic shapes found in nature.OJ(1).jpg",
"folder_5/A lamp handmade from natural materials to create a rustic, earthy aesthetic. The lamp should be crafted from materials such as wood, stone, or natural fibers, and feature a design inspired by the organic shapes found in nature.OJ.jpg",
"folder_5/A lamp inspired by Donald Trump, the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents.SD.jpg",
"folder_5/A lamp inspired by TU Delft blue, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed1MJ.png",
"folder_5/A lamp inspired by TU Delft blue, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed3MJ.png",
"folder_5/A lamp inspired by Warhammer 40K aesthetics, isometric viewpoint, clear background, 3d printed1MJ.png",
"folder_5/A lamp inspired by Warhammer 40K aesthetics, isometric viewpoint, clear background, 3d printed2MJ.png",
"folder_5/A lamp inspired by civil engineering designs, incorporating industrial materials like steel and concrete, Featuring a streamlined, minimalist design with clean lines and simple shapesOJ.jpg",
"folder_5/A lamp inspired by the Cthulhu mythos and Starcraft aesthetics, 3d printed3MJ.png",
"folder_5/A lamp inspired by the Cthulhu mythos and Starcraft aesthetics, 3d printed4MJ.png",
"folder_5/A lamp inspired by the Cthulhu mythos and Starcraft_s Protoss aesthetics, clear background, 3d printed1MJ.png",
"folder_5/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.SD(1).jpg",
"folder_5/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics.OJ.jpg",
"folder_5/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents.DE.jpg",
"folder_5/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents.OJ(1).jpg",
"folder_5/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.SD(3).jpg",
"folder_5/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed1MJ.png",
"folder_5/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed2MJ.png",
"folder_5/A lamp inspired by the Tzeentch factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_5/A lamp inspired by the aesthetic of the Qin Dynasty and horror games, full front, render style, orthographic full view of the design from behind, and a solid color background, photorealistic, orthographic views --upbeta --v 543MJ.png",
"folder_5/A lamp inspired by the aesthetic of the Qin Dynasty and horror games, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_5/A lamp inspired by the aesthetics of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_5/A lamp inspired by the choas factions in Warhammer 40K aesthetics, isometric viewpoint, full front, orthographic full view of the design from behind, and a transparent background, 3d printed2MJ.png",
"folder_5/A lamp inspired by the cyberpunk and the aesthetics of the armies in Ming Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_5/A lamp inspired by the cyberpunk and the aesthetics of the armies in Ming Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_5/A lamp inspired by the mixed aesthetics of Starcraft_s Terran and Protoss factions, full front, render style, orthographic full view of the design from behind, and a solid color background1MJ.png",
"folder_5/A lamp inspired by the mixed aesthetics of Starcraft_s Terran and Protoss factions, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_5/A lamp inspired by the slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a transparent background, 3d printed2MJ.png",
"folder_5/A lamp that has a translucent, dome-shaped shade resembling a jellyfish bell, It has long, trailing tentacles made from fiber-optic cables that emit a soft glow, creating a mesmerizing effectOJ.jpg",
"folder_5/A lamp that resembles a hairbrush, with a handle and bristles made from flexible plastic or silicone, It has two brightness settings_ one for bright, functional light when needed and another for a soft, warm glow to create a relaxing ambiance.DE.jpg",
"folder_5/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical piece, cold lightOJ.jpg",
"folder_5/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical piece, solidSD.jpg",
"folder_5/A lamp with a base made from natural wood, with a smooth, polished finish, It features an adjustable arm, allowing users to direct and focus the light on a specific area.OJ.jpg",
"folder_5/A lamp with a base made from natural wood, with a smooth, polished finish, It features an adjustable arm, allowing users to direct and focus the light on a specific area.SD.jpg",
"folder_5/A lamp with a fluffy fur cover that resembles sheep, A lamp with a unique design inspired by the texture of sheep furSD.jpg",
"folder_5/A lamp with a minimalist design in soft colors made from wood, lampshade made from see-through material, render styleSD.jpg",
"folder_5/A lamp with a minimalist design in soft colours and wood materials, with a lampshade made of see-through material, render styleOJ(1).jpg",
"folder_5/A lamp with a minimalist design in white and black colors, with a lampshade made of see-through material, render styleOJ.jpg",
"folder_5/A lamp with a multi-colored stained glass lampshade, elegant style, minimalisticOJ.jpg",
"folder_5/A lamp with a warm and cozy wooden-style appearance, incorporating a minimalist and modern concrete element to its designDE.jpg",
"folder_5/A lamp with an articulated arm that can be adjusted into various positions, A lampshade made of glass that changes color depending on the angle of the light, A base made of wood with a carved design resembling a tree trunkDE.jpg",
"folder_5/A lamp with an articulated arm that can be adjusted into various positions, A lampshade made of glass that changes color depending on the angle of the light, A base made of wood with a carved design resembling a tree trunkSD.jpg",
"folder_5/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 54(1)3MJ.png",
"folder_5/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 54(2)1MJ.png",
"folder_5/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 54(2)3MJ.png",
"folder_5/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist designDE.jpg",
"folder_5/A lamp with, designed to emit a soft glow, made from recycled materials, minimalist, eco-friendly design, featuring a woven or macrame%C3%8C_-style lampshadeSD.jpg",
"folder_5/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 54(1)2MJ.png",
"folder_5/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 544MJ.png",
"folder_5/A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glow, clear background, render styleSD.jpg",
"folder_5/A sculptural lamp with an organic, flowing design, A minimalist lamp with geometric, angular features, A playful lamp with a whimsical, eye-catching appearanceSD.jpg",
"folder_5/A simple design that features a wooden base and a soft lighting sourceDE(1).jpg",
"folder_5/A simple design that features a wooden base and a soft lighting sourceDE.jpg",
"folder_5/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 542MJ.png",
"folder_5/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 544MJ.png",
"folder_5/A steampunk-inspired lamp with a metallic, industrial base and a mason jar-inspired clear glass housing, The lampshade is designed to mimic the pattern of plant leaves, adding a fresh and calming ambiance to any spaceOJ.jpg",
"folder_5/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(1)1MJ.png",
"folder_5/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(2)2MJ.png",
"folder_5/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth.DE.jpg",
"folder_5/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth.SD(1).jpg",
"folder_5/An elegant table lamp with a smooth, polished wood base and a soft, diffused light that_s perfect for creating a cozy atmosphere, A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glowSD.jpg",
"folder_5/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenityDE.jpg",
"folder_5/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(2)4MJ.png",
"folder_5/An inviting lamp with, featuring a unique and striking bottom view to provide visual interest, incorporating a minimalist and modern concrete element to its designDE.jpg",
"folder_5/An oil painting inspired lamp design with sleek and elegant linesnd polished look and web-inspired elementsOJ.jpg",
"folder_5/An oil-painting of an sleek and elegant lamp with subtle web-inspired detailsOJ(1).jpg",
"folder_5/An oil-painting of an sleek and elegant lamp with subtle web-inspired detailsSD(1).jpg",
"folder_5/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 44(1)3MJ.png",
"folder_5/An oil-painting style, elegant and sleek lamp design with subtle web-inspired details --upbeta --v 442MJ.png",
"folder_5/An oil-painting style, without background, only a elegant and sleek lamp design with subtle web-inspired details --upbeta --v 443MJ.png",
"folder_5/Art Deco inspired lamp with elegant curves and geometric shapes,_ _Streamlined body with silver accents in typical Art Deco fashion,_ _Angular, symmetrical lamp,  isometric viewpoint, full frontal view of the design, realistic._OJ.jpg",
"folder_5/Create a haunting ambiance with eerie shadows, Indulge in your dark fantasies with lamp illumination, Instills a spine-chilling sense of forebodingDE.jpg",
"folder_5/Create a whimsical lamp design that resembles a mushroom, with a cap-shaped lampshade and a slim stem-like base. The lampshade should be made of frosted glass or eco-friendly plastic that glows softly, and the base can be made of wood or ceramic.DE.jpg",
"folder_5/Cthulhu-inspired lamp with a slimy ghost-like face and robotic accents.DE.jpg",
"folder_5/Cthulhu-inspired lamp with a slimy ghost-like face and robotic accents.SD.jpg",
"folder_5/Design a beautiful biophilic lamp that incorporates natural elements and materials, such as a lampshade made of woven bamboo or rattan, and a base made of reclaimed driftwood or stone.OJ.jpg",
"folder_5/Design a lamp inspired by the shape and structure of a tree, with a sleek and minimalistic design that mimics its branches and leaves. The lamp should use energy-efficient LED bulbs that give off a natural warm glow.OJ.jpg",
"folder_5/Design a modern table lamp with clear glass lampshade and a metallic base. The lamp should have a warm white LED bulb and be approximately 18 inches highOJ.jpg",
"folder_5/Discover elegant lamp designs that accentuate any space, Unleash the creativity in you with the latest lamp designs, Elevate your decor game with innovative lamp designsDE.jpg",
"folder_5/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE(3).jpg",
"folder_5/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE(8).jpg",
"folder_5/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ(2).jpg",
"folder_5/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD(1).jpg",
"folder_5/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD.jpg",
"folder_5/Geometric 3D lamp, Simple yet functional design, Monochromatic color palette, Minimalist aesthetic, Emphasis on form and structure, Use of 3D printing-friendly materialsSD.jpg",
"folder_5/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta --v 542MJ.png",
"folder_5/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta4(1)3MJ.png",
"folder_5/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation,clear background, isometric view --upbeta --v 542MJ.png",
"folder_5/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta4(1)2MJ.png",
"folder_5/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta4(1)3MJ.png",
"folder_5/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view, multi-colour light --upbeta4(1)2MJ.png",
"folder_5/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.OJ(2).jpg",
"folder_5/Lamp design, Copper lamp base, European-style lampshade, Glass crystal pendant, Hand-carved, Candle-like light bulb, orthographic front view, --upbeta44MJ.png",
"folder_5/Let the peaceful and gentle aura of Lapras inspire a soothing and elegant lamp design, evoking memories of adventure and serenity in your living space --upbeta --v 444MJ.png",
"folder_5/Minimalist teardrop-shaped lamp with a matte black finish, Multi-functional lamp with an extendable arm for reading and writingOJ.jpg",
"folder_5/Origami-inspired lamp design with neon lights and tube LEDs, using topology optimization to achieve a unique folded lamp structure2MJ.png",
"folder_5/QQ email address lamp, Wechat, Whatsapp, isometric view, 3d printable, app design --upbeta --v 543MJ.png",
"folder_5/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated propotions --upbeta44MJ.png",
"folder_5/Smooth and non-porous porcelain material for easy-to-clean maintenance,blue dimming light, steampunk, huge, dolphin-likeOJ.jpg",
"folder_5/The lamp also emits light for sighted users, but the vibration feature can be used independently, Includes a self-defense tool in case of emergency, Utilizes modern and sleek design elements for aesthetic appealDE.jpg",
"folder_5/The lamp_s base is designed to resemble a vintage candlestick holderOJ.jpg",
"folder_5/Warcraft-inspired lamp with a slimy ghost-like face and robotic accents.SD.jpg",
"folder_5/Warhammer-inspired lamp with a slimy ghost-like face and robotic accents.OJ(1).jpg",
"folder_5/_A lamp with fluid lines, whose form can be gracefully curved towards the ground for a unique, contemporary look._SD(3).jpg",
"folder_5/_Streamlined 3D printable Art Deco lamp with geometric shapes and silver accents,_ _Castable lamp design with symmetrical angular body and vivid color scheme._OJ.jpg",
"folder_5/_Streamlined 3D printable Art Deco lamp with geometric shapes and silver accents,_ _Castable lamp design with symmetrical angular body and vivid color scheme._SD(1).jpg",
"folder_5/a cute lamp(3).jpg",
"folder_5/a cute lamp.jpg",
"folder_5/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsDE.jpg",
"folder_5/a lamp design with greek sculpture and geometricOJ.jpg",
"folder_5/a lamp design, 3d modelling render, game terraria, FULL LAMPSD.jpg",
"folder_5/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPOJ.jpg",
"folder_5/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPSD(2).jpg",
"folder_5/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --upbeta --v 544MJ.png",
"folder_5/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta43MJ.png",
"folder_5/a lamp design, 3d modelling, apex legends guns,OJ(1).jpg",
"folder_5/a lamp design, 3d modelling, apex legends guns,SD(3).jpg",
"folder_5/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPDE(1).jpg",
"folder_5/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPDE.jpg",
"folder_5/a lamp design, 3d modelling, oxygen not included style, FULL LAMPDE.jpg",
"folder_5/a lamp design, greek sculpture and geometricDE.jpg",
"folder_5/a lamp with Lovecraft-style and Donald Trump4(2)4MJ.png",
"folder_5/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 54(2)4MJ.png",
"folder_5/a lamp, guitar like material with strings on it, combine with plants, can be used like a bluetooth speakerOJ.jpg",
"folder_5/a topology industry style metal lamp with futuristic and a mystical lightOJ.jpg",
"folder_5/a vintage-style lamp from the house Gryffindor of Harry Potter MJ.png",
"folder_5/ancient scenario, fashionable lamp, egg, calender, flower, orthographic front view, exaggerated propotionsSD.jpg",
"folder_5/anthentic, harsh, dino, essay, interesting, traditional, lamp design, orthographic front view,OJ.jpg",
"folder_5/champion shirt lamp, big brand, LV, Gucci, Prada, isometric view, Chanel, 3d printable --upbeta43MJ.png",
"folder_5/female lamp with delft university of technology style on itSD(1).jpg",
"folder_5/female lampOJ.jpg",
"folder_5/flying dog lamp, jewellery, grammerly, chatgpt, isometric view, 3d printable --upbeta43MJ.png",
"folder_5/full female lampDE.jpg",
"folder_5/lamp design blending the aesthetics of a modern violin with adjustable lighting elements for a sound and light experience, in a context with it_s playerOJ.jpg",
"folder_5/lamp design featuring a childish style and light colour tone, with multiple buttons, in a vintage styleSD.jpg",
"folder_5/lamp design featuring a futuristic cyber-punk style and touch-sensitive controls embedded in the base for easy brightness adjustment%C3%AF%C2%BC__simulating human-shape, from top-viewSD.jpg",
"folder_5/lamp design for a cat MJ.png",
"folder_5/lamp design inspired by musical instruments combining sleek shapes with functional lighting elements, a lamp that could be used as an instrumentOJ.jpg",
"folder_5/lamp design with modern violin aesthetics and adjustable lighting for sound and light experience, with someone playing itOJ.jpg",
"folder_5/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta4(1)1MJ.png",
"folder_5/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta4(1)2MJ.png",
"folder_5/lamp design,with wool wall material, black hole feeling, Christian style ,wooden glassesSD.jpg",
"folder_5/lamp design,wool wall material, cozy feelingSD.jpg",
"folder_5/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a chinese dragon,full lamp view,DE.jpg",
"folder_5/lamp lamb lamb lamp lamp lamb lamb lamp hahahaDE(1).jpg",
"folder_5/lamp lamb lamb lamp lamp lamb lamb lamp hahahaOJ.jpg",
"folder_5/lamp made of C60 materials, Inspired by the ancient myths of Middle-earth, designed to look like the WeChat logo from a top-view perspective,solid color background, render style --upbeta --v 541MJ.png",
"folder_5/lamp made of C60 materials, Inspired by the ancient myths of Middle-earth, designed to look like the WeChat logo from a top-view perspective,solid color background, render style --upbeta --v 542MJ.png",
"folder_5/lamp that has a circled shape, Emits a bright and clear light for visibility in low light conditions, Made out of metal for durability and a modern lookOJ.jpg",
"folder_5/lamp that helps blind people to sense light4(1)4MJ.png",
"folder_5/lamp that helps blind people to sense light42MJ.png",
"folder_5/lamp that helps students relax when they are stressed, with rounded shapes that can be placed in different parts of the student house, made out of metalOJ.jpg",
"folder_5/lamp with a overworld style but with solid functionality, can be driven by people --upbeta4(1)4MJ.png",
"folder_5/lamp with a overworld style but with solid functionality, can be driven by people --upbeta43MJ.png",
"folder_5/lamp with blue color and right lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashDE.jpg",
"folder_5/lamp with blue color and right lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashOJ.jpg",
"folder_5/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta --v 543MJ.png",
"folder_5/lamp with single geometric shape --upbeta --v 444MJ.png",
"folder_5/lamp, Complementing the surrounding furniture, such as a chairDE.jpg",
"folder_5/lamp, Complementing the surrounding furniture, such as a chairOJ.jpg",
"folder_5/lamp, Complementing the surrounding furniture, such as a chairSD.jpg",
"folder_5/lamp, Minimalism, Visually striking, Streamlined design, Customization, Refined lighting, Space elevation. And the Chinese translationSD.jpg",
"folder_5/minimalist yet captivating mountain-inspired lamp with unique silhouette, render styleDE.jpg",
"folder_5/minimalist yet captivating mountain-inspired lamp with unique silhouette, render styleOJ.jpg",
"folder_5/musical, Budapest, candy, perfume, christmas, 3d printed, lamp --upbeta41MJ.png",
"folder_5/only lamp design, Minimalism, Visually striking, Streamlined design, Customization, Refined lighting, Space elevation. And the Chinese translationDE.jpg",
"folder_5/only lamp design, Minimalism, Visually striking, Streamlined design, Customization, Refined lighting, Space elevation. And the Chinese translationSD.jpg",
"folder_5/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfume --upbeta --v 54(1)3MJ.png",
"folder_5/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfume --upbeta --v 541MJ.png",
"folder_5/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta --v 541MJ.png",
"folder_5/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta --v 541MJ.png",
"folder_5/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta --v 542MJ.png",
"folder_5/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta --v 542MJ.png",
"folder_5/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta --v 542MJ.png",
"folder_5/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta4(2)2MJ.png",
"folder_6/1_Harry Potter lamp MJ.png",
"folder_6/1_Make me a lamp that can make everyone else unhappy except me MJ.png",
"folder_6/1_make me a heterosexual lamp MJ.png",
"folder_6/1_slender man lamp MJ.png",
"folder_6/2_1_a lamp that cast light from a bald man_s head, shining bald head, no hear, funny, creepy MJ.png",
"folder_6/2_1_lamp combined with plants MJ.png",
"folder_6/2_1_slender man lamp MJ.png",
"folder_6/3D printable disturbing vintage lamp for horror movie setting, render style, modern lookingOJ.jpg",
"folder_6/3D printable disturbing vintage lamp for horror movie setting, render style, modern lookingSD.jpg",
"folder_6/3D printable lamp with single geometric shape, Utilizing 3D printing-friendly materials --upbeta --upbeta --v 443MJ.png",
"folder_6/3D printable lamp,  Mosaic patterns, Organic shapes, Nature-inspired designs, Bright and bold color schemes, Unconventional materialsDE.jpg",
"folder_6/3D printable lamp, Gaudi, Curving shapes and lines, Whimsical and playful design elements, Inspired by natural forms and patterns, Mosaic tile embellishments, Use of bold and unique colors, Geometric shapes and patternsDE(1).jpg",
"folder_6/3D printable lamp, Gaudi, Curving shapes and lines, Whimsical and playful design elements, Inspired by natural forms and patterns, Mosaic tile embellishments, Use of bold and unique colors, Geometric shapes and patternsSD.jpg",
"folder_6/3D printable lamp, GaudiOJ.jpg",
"folder_6/3D printable lamp, Mosaic patterns, Organic shapes, Nature-inspired designs, Bright and bold color schemes, Unconventional materials, GaudiOJ.jpg",
"folder_6/3_2_1_a lamp that is suitable for a indoor tennis court MJ.png",
"folder_6/3_2_1_make me a lamp that is a collective of human hands with eyes in the palm growing like a tree MJ.png",
"folder_6/3d printable lamp, Single geometric shape, Minimalist design, Bold and clean lines, Sharp edges and corners, Use of negative spaceSD(1).jpg",
"folder_6/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelDE.jpg",
"folder_6/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelOJ(4).jpg",
"folder_6/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelSD(3).jpg",
"folder_6/3d printable lamp, aerodynamic streamline, symmetryOJ(2).jpg",
"folder_6/A cute lamp shaped as a bunny made of smooth wood, eyes made of transparent plastic to resemble bunny_s eyesOJ.jpg",
"folder_6/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 54(1)4MJ.png",
"folder_6/A lamp designed specifically for blind users that translates light intensity into vibration, The lamp also emits light for sighted users, but the vibration feature can be used independentlySD.jpg",
"folder_6/A lamp designed to celebrate Día de Muertos with a unique and colorful aesthetic, Features different color emission options for variety in lighting, Has light sensitivity that reacts to sound or music to create a dynamic display for festive eventsSD.jpg",
"folder_6/A lamp inspired by TU Delft, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.SD.jpg",
"folder_6/A lamp inspired by cyberpunk and the aesthetic of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background --upbeta --v 544MJ.png",
"folder_6/A lamp inspired by the Cthulhu mythos and Starcraft aesthetics, 3d printed2MJ.png",
"folder_6/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.OJ(1).jpg",
"folder_6/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents.OJ.jpg",
"folder_6/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring cyberpunk accents.OJ.jpg",
"folder_6/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics.DE.jpg",
"folder_6/A lamp inspired by the Nurgle factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a transparent background, 3d printed4MJ.png",
"folder_6/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.DE.jpg",
"folder_6/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.OJ(1).jpg",
"folder_6/A lamp inspired by the aesthetic of the Qin Dynasty and horror games, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_6/A lamp inspired by the aesthetics of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_6/A lamp inspired by the choas factions in Warhammer 40K aesthetics, isometric viewpoint, full front, orthographic full view of the design from behind, and a transparent background, 3d printed3MJ.png",
"folder_6/A lamp inspired by the cyberpunk and the aesthetics of the armies in Ming Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_6/A lamp inspired by the slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a transparent background, 3d printed3MJ.png",
"folder_6/A lamp inspired by traditional Chinese cuisine, such as dumplings, tofu, and other delicacies, featuring intricate details in its design, A sheep-inspired lamp design with soft woolen textures and warm, earthy tonesOJ.jpg",
"folder_6/A lamp that resembles a furry animal or creature, It has a wireless charging feature for compatible devices, making it a multi-functional accessory for any furry friend lover., The lampshade is made from faux fur, creating a cozy and warm ambianceDE.jpg",
"folder_6/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical piece, cold lightDE.jpg",
"folder_6/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical pieceDE.jpg",
"folder_6/A lamp with a geometrically shaped lampshade in black and white patternsDE.jpg",
"folder_6/A lamp with a minimalist design in soft colors made from wood, lampshade made from see-through material, render styleDE.jpg",
"folder_6/A lamp with a minimalist design in soft colours, with a lampshade made of see-through material, render styleOJ.jpg",
"folder_6/A lamp with a minimalist design in white and black colors, with a lampshade made of see-through materialSD.jpg",
"folder_6/A lamp with a multi-colored stained glass lampshade, elegant style, minimalistic colorsOJ.jpg",
"folder_6/A lamp with a spider-like appearance, Inspired by Dyson designDE.jpg",
"folder_6/A lamp with a warm and cozy wooden-style appearance, incorporating a minimalist and modern concrete element to its designSD.jpg",
"folder_6/A lamp with a whimsical and uplifting design, featuring a base made from inflated or molded balloons tied together to form a cluster or bouquetDE.jpg",
"folder_6/A lamp with a whimsical and uplifting design, featuring a base made from inflated or molded balloons tied together to form a cluster or bouquetSD.jpg",
"folder_6/A lamp with an irregular, organic shape, reminiscent of a sea creature, A lamp with a vintage-inspired design, reminiscent of mid-century modern furnitureDE.jpg",
"folder_6/A lamp with an irregular, organic shape, reminiscent of a sea creature, A lamp with a vintage-inspired design, reminiscent of mid-century modern furnitureOJ.jpg",
"folder_6/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 541MJ.png",
"folder_6/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist designOJ.jpg",
"folder_6/A lamp with clean lines and simple shapes, inspired by civil engineering designs, render style, minimalist design --upbeta --v 544MJ.png",
"folder_6/A lamp with, a sleek and modern exterior design made of C60 materials, created to have a minimalist, top-view look resembling the popular communication app WhatsApp, inspired by the enchanting myths of Middle-earth in its interior designDE.jpg",
"folder_6/A lamp with, a sleek and modern exterior design made of C60 materials, created to have a minimalist, top-view look resembling the popular communication app WhatsApp, inspired by the enchanting myths of Middle-earth in its interior designOJ.jpg",
"folder_6/A lamp with, a sleek and modern exterior design made of C60 materials, created to have a minimalist, top-view look resembling the popular communication app WhatsApp, inspired by the enchanting myths of Middle-earth in its interior designSD.jpg",
"folder_6/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 54(1)4MJ.png",
"folder_6/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 542MJ.png",
"folder_6/A modern desk lamp with a matte black wooden base and an exposed filament bulb that produces a warm, soft light perfect for readingOJ.jpg",
"folder_6/A simple design that features a wooden base and a soft lighting sourceOJ.jpg",
"folder_6/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped top --upbeta --v 54(1)2MJ.png",
"folder_6/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped top --upbeta --v 542MJ.png",
"folder_6/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(3)1MJ.png",
"folder_6/A sleek and polished lamp design with a web style touchSD.jpg",
"folder_6/A steampunk-inspired lamp with a metallic, industrial base and a mason jar-inspired clear glass housing, The lampshade is designed to mimic the pattern of plant leaves, adding a fresh and calming ambiance to any spaceDE.jpg",
"folder_6/A table lamp with a wavy wooden base and a translucent glass shade in the shape of a flowerSD.jpg",
"folder_6/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(1)2MJ.png",
"folder_6/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(1)3MJ.png",
"folder_6/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(4)2MJ.png",
"folder_6/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuaryOJ.jpg",
"folder_6/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuarySD.jpg",
"folder_6/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth.OJ.jpg",
"folder_6/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth1MJ.png",
"folder_6/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenityDE(1).jpg",
"folder_6/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenityOJ(2).jpg",
"folder_6/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(2)3MJ.png",
"folder_6/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta42MJ.png",
"folder_6/An ocean-inspired table lamp with a wavy blue glass base and a white fabric drum shade that evokes the calming waves of a peaceful seaOJ.jpg",
"folder_6/An oil painting inspired lamp design with sleek and elegant linesnd polished look and web-inspired elementsSD.jpg",
"folder_6/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 44(2)1MJ.png",
"folder_6/An oil-painting inspired lamp design with subtle web-inspired detailsDE.jpg",
"folder_6/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 44(1)2MJ.png",
"folder_6/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 44(1)4MJ.png",
"folder_6/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 44(2)2MJ.png",
"folder_6/Art Deco inspired lamp with elegant curves and geometric shapes,_ _Streamlined body with silver accents in typical Art Deco fashion,_ _Angular, symmetrical lamp,  isometric viewpoint, full frontal view of the design, realistic._DE.jpg",
"folder_6/Create a modern and stylish lamp that incorporates geometric shapes and a mixture of colors in the design.SD.jpg",
"folder_6/Cybernetic mechanisms, dancing lamp, emotional, orthographic front viewOJ(1).jpg",
"folder_6/Cylindrical-shaped lamp with a soft and fluffy wool fabric finishDE.jpg",
"folder_6/Design a beautiful biophilic lamp that incorporates natural elements and materials, such as a lampshade made of woven bamboo or rattan, and a base made of reclaimed driftwood or stone.DE.jpg",
"folder_6/Design a small and compact waterproof 3D-printable lamp that is suitable for travelOJ.jpg",
"folder_6/Design a water-resistant lamp suitable for outdoor use in any weather conditions, Features a rechargeable battery for convenience and portabilityDE.jpg",
"folder_6/Discover elegant lamp designs that accentuate any space, Unleash the creativity in you with the latest lamp designs, Elevate your decor game with innovative lamp designsSD.jpg",
"folder_6/Futuristic 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint --upbeta --v 442MJ.png",
"folder_6/Futuristic and avant-garde, Unibody 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint4MJ.png",
"folder_6/Has light sensitivity that reacts to sound or music to create a dynamic display for festive events, A long lamp with a wooden appearance that is narrow at the bottom and widens towards the top, portableDE.jpg",
"folder_6/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta4(1)2MJ.png",
"folder_6/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta4(1)4MJ.png",
"folder_6/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta4(2)3MJ.png",
"folder_6/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta4(1)4MJ.png",
"folder_6/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view --upbeta44MJ.png",
"folder_6/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view, multi-colour light --upbeta4(1)1MJ.png",
"folder_6/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.OJ.jpg",
"folder_6/Lamp design, Copper lamp base, European-style lampshade, Glass crystal pendant, Hand-carved, Candle-like light bulb, ographic front view,SD.jpg",
"folder_6/Large steampunk-style lamp with a wooden-textured porcelain finish, Sleek and shark-like silhouette design for a unique and captivating lookSD.jpg",
"folder_6/Let the peaceful and gentle aura of Lapras inspire a soothing and elegant lamp design, evoking memories of adventure and serenity in your living space --upbeta --v 443MJ.png",
"folder_6/Prompts_ _Art Deco inspired lamp with elegant curves and geometric shapes,_ _Streamlined body with silver accents in typical Art Deco fashion,_ _Angular, symmetrical lamp with bold color scheme._DE.jpg",
"folder_6/Prompts_ _Art Deco inspired lamp with elegant curves and geometric shapes,_ _Streamlined body with silver accents in typical Art Deco fashion,_ _Angular, symmetrical lamp with bold color scheme._OJ.jpg",
"folder_6/Prompts_ _Art Deco inspired lamp with elegant curves and geometric shapes,_ _Streamlined body with silver accents in typical Art Deco fashion,_ _Angular, symmetrical lamp with bold color scheme._SD.jpg",
"folder_6/QQ email address lamp, Wechat, Whatsapp, isometric view, 3d printable, app design --upbeta --v 541MJ.png",
"folder_6/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta --v 541MJ.png",
"folder_6/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta42MJ.png",
"folder_6/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated propotionsSD.jpg",
"folder_6/Satan lamp MJ.png",
"folder_6/Sleek lamp designSD.jpg",
"folder_6/Unibody 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint4MJ.png",
"folder_6/Warhammer-inspired lamp with a slimy ghost-like face and robotic accents.DE(1).jpg",
"folder_6/Whimsical design, Artistic structure, Color-changing lighting, Innovative mechanisms, Playful shapes, Interactive lighting, Abstract forms, Exaggerated proportions, Surreal style.DE.jpg",
"folder_6/_A lamp with fluid lines, whose form can be gracefully curved towards the ground for a unique, contemporary look._SD(2).jpg",
"folder_6/_A minimalist lamp with a sleek, modular design that can be easily reconfigured to suit various settings and moods, as it delivers elegant, understated lightingOJ(1).jpg",
"folder_6/_A minimalist lamp with a sleek, modular design that can be easily reconfigured to suit various settings and moods, as it delivers elegant, understated lightingOJ.jpg",
"folder_6/a lamp design in 3d modelling, greek sculpture and geometricOJ(1).jpg",
"folder_6/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lights, the film named the wandering earthDE.jpg",
"folder_6/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsOJ(2).jpg",
"folder_6/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsOJ.jpg",
"folder_6/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --upbeta --v 543MJ.png",
"folder_6/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --v 544MJ.png",
"folder_6/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta42MJ.png",
"folder_6/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPSD.jpg",
"folder_6/a lamp design, 3d modelling, apex legends guns, FULL LAMPDE(1).jpg",
"folder_6/a lamp design, 3d modelling, apex legends guns, FULL LAMPSD(1).jpg",
"folder_6/a lamp design, 3d modelling, apex legends guns,OJ(3).jpg",
"folder_6/a lamp design, 3d modelling, apex legends guns,SD(1).jpg",
"folder_6/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPOJ(1).jpg",
"folder_6/a lamp design, 3d modelling, game _oxygen not included_ style, FULL LAMPSD.jpg",
"folder_6/a lamp design, guitar like material with strings on it, combination with plants, a bluetooth speakerOJ.jpg",
"folder_6/a lamp from the brand Apple which has its typical design characteristics MJ.png",
"folder_6/a lamp showing vegan notion, vegan slogan, no meat, support vegan lifestyle MJ.png",
"folder_6/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 541MJ.png",
"folder_6/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 544MJ.png",
"folder_6/a lamp that has a laberinth that changes colour so children can play while parents are busy, with a rounded shape and water resistant42MJ.png",
"folder_6/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 54(1)3MJ.png",
"folder_6/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 543MJ.png",
"folder_6/adjustable, lamp, playful, automatic, artistic, unique, orthographic viewSD.jpg",
"folder_6/anthentic, harsh, dino, essay, interesting, traditional, lamp design, orthographic front view,SD.jpg",
"folder_6/champion shirt lamp, big brand, LV, Gucci, Prada, isometric view, Chanel, 3d printable --upbeta41MJ.png",
"folder_6/cute robot-shaped lamp with touch screen in a futuristic settingOJ.jpg",
"folder_6/elegant lampSD(1).jpg",
"folder_6/flying dog lamp, jewellery, grammerly, chatgpt, isometric view, 3d printable --upbeta44MJ.png",
"folder_6/lamp design combining a classic toy-inspired appearance vibrant buttons and a vintage twist for interactive funOJ.jpg",
"folder_6/lamp design featuring a childish style and light colour tone, with multiple buttons, in a vintage styleOJ.jpg",
"folder_6/lamp design featuring a minimalist futuristic style and touch-sensitive controls embedded in the base for easy brightness adjustment%C3%AF%C2%BC_optimal light, home environmentOJ.jpg",
"folder_6/lamp design featuring a minimalist futuristic style and touch-sensitive controls embedded in the base for easy brightness adjustment%C3%AF%C2%BC_optimal light, home environmentSD.jpg",
"folder_6/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta --upbeta --v 541MJ.png",
"folder_6/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta --upbeta --v 543MJ.png",
"folder_6/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta --v 543MJ.png",
"folder_6/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta4(1)4MJ.png",
"folder_6/lamp design,with wool wall material, black hole feeling, Christian style ,wooden glassesOJ.jpg",
"folder_6/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a chinese dragon,full lamp view,OJ.jpg",
"folder_6/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a snakeSD.jpg",
"folder_6/lamp in a robotic shape, with no bottom but a touch screen, in a futuristic scenario, movie textureDE.jpg",
"folder_6/lamp lamb lamb lamp lamp lamb lamb lamp hahahaSD(2).jpg",
"folder_6/lamp that could appear in Tom and Jerry, full view, render style, cute shape, white backgroundOJ.jpg",
"folder_6/lamp that helps moms to indicate when their baby formula is ready, with music and aesthetic shape41MJ.png",
"folder_6/lamp that helps moms to indicate when their baby formula is ready, with music and aesthetic shape42MJ.png",
"folder_6/lamp that helps moms to indicate when their baby formula is ready, with music and aesthetic shape43MJ.png",
"folder_6/lamp with a overworld style but with solid functionality, can be driven by people --upbeta41MJ.png",
"folder_6/lamp with dog feature but this looks like a machine, and have engine on it --upbeta41MJ.png",
"folder_6/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta --v 544MJ.png",
"folder_6/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta4(1)1MJ.png",
"folder_6/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta43MJ.png",
"folder_6/lamp, guitar, vegan, city, designer, club --upbeta43MJ.png",
"folder_6/lamp,3D printing technology to bring this modern design to life, A lamp with a sleek, geometric shape and quirky, whimsical details, Creating a unique, eye-catching pieceOJ.jpg",
"folder_6/make me a heterosexual lamp MJ.png",
"folder_6/milk, lamp, cartoon, abstract, remote, female, computer, orthographic front view, exaggerated propotionsSD(1).jpg",
"folder_6/musical, Budapest, candy, perfume, christmas, 3d printed, lamp --upbeta --v 543MJ.png",
"folder_6/musical, Budapest, candy, perfume, christmas, 3d printed, lamp --upbeta --v 544MJ.png",
"folder_6/musical, Budapest, candy, perfume, christmas, 3d printed, lamp --upbeta43MJ.png",
"folder_6/musical, Budapest, candy, perfume, christmas, 3d printed, lamp --upbeta44MJ.png",
"folder_6/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfume --upbeta --v 543MJ.png",
"folder_6/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta4(1)4MJ.png",
"folder_6/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta41MJ.png",
"folder_6/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta --v 54(1)3MJ.png",
"folder_6/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta4(1)2MJ.png",
"folder_6/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta43MJ.png",
"folder_6/playful lamp --upbeta --v 542MJ.png",
"folder_6/round shape lamp, smooth surface without complex patterns --upbeta --v 443MJ.png",
"folder_6/soft loud major moderate lamp, yellow white pink rainbow, isometric view, 3d printable --upbeta41MJ.png",
"folder_6/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta --v 541MJ.png",
"folder_6/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta4(1)3MJ.png",
"folder_6/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta4(2)4MJ.png",
"folder_6/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta41MJ.png",
"folder_6/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta --v 541MJ.png",
"folder_6/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta42MJ.png",
"folder_6/whole-person inspired cute robotic lamp with touch screen and futuristic elementsDE.jpg",
"folder_7/1_Cthulhu lamp MJ.png",
"folder_7/1_Make me a lamp that can eliminate human race MJ.png",
"folder_7/1_a lamp of seven man dancing on it, paper material, with a base, colorful, chinese style MJ.png",
"folder_7/1_a lamp that is suitable for a indoor tennis court MJ.png",
"folder_7/1_a portable lamp for outdoor activities MJ.png",
"folder_7/1_a vintage-style lamp from the house Gryffindor of Harry Potter MJ.png",
"folder_7/1_lamp attached to the headboard of the bed MJ.png",
"folder_7/1_small size lamp for kindergarten playroom MJ.png",
"folder_7/2_1_a lamp showing vegan notion, vegan slogan, no meat, support vegan lifestyle MJ.png",
"folder_7/2_1_a portable lamp for outdoor activities MJ.png",
"folder_7/2_1_a souvenir lamp from the faculty of industrial design and engineering, TUDelft, the Netherlands MJ.png",
"folder_7/2_1_lamp for a reading corner MJ.png",
"folder_7/2_1_make me a lamp that is a collective of all kinds of human limbs MJ.png",
"folder_7/2_1_my little pony style lamp MJ.png",
"folder_7/3D printable modern creepy fish-themed lamp with unique design, render style, full view, with black background colorSD.jpg",
"folder_7/3_2_1_1980s sci-fi style lamp MJ.png",
"folder_7/3_2_1_Harry Potter lamp MJ.png",
"folder_7/3_2_1_lamp design for a cat MJ.png",
"folder_7/3d printable lamp, Single geometric shape, Minimalist design, Bold and clean lines, Sharp edges and corners, Use of negative spaceDE.jpg",
"folder_7/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelDE(1).jpg",
"folder_7/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelOJ(2).jpg",
"folder_7/3d printable lamp, aerodynamic streamline, symmetryDE(2).jpg",
"folder_7/3d printable lamp, aerodynamic streamline, symmetryOJ(1).jpg",
"folder_7/3d printable lamp, aerodynamic streamline, symmetrySD(2).jpg",
"folder_7/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright color that complements the stem, The lamp should be made with 3D-printable materials, render style, full lamp viewOJ.jpg",
"folder_7/A brightly colored tulip-shaped lamp with a slender stemOJ.jpg",
"folder_7/A coloful man-shaped shinning lamp design, orthographic front view,SD.jpg",
"folder_7/A contemporary lamp design with a sleek and polished look and web-inspired elementsOJ.jpg",
"folder_7/A contemporary lamp design with a sleek and polished look and web-inspired elementsSD.jpg",
"folder_7/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 54(1)2MJ.png",
"folder_7/A cute lamp shaped as a snake made of smooth wood, isometric view,render style, abstractSD.jpg",
"folder_7/A cute lamp shaped as a snake made of smooth wood, isometric view,render styleDE.jpg",
"folder_7/A lamp inspired by Dadaism and the aesthetic of the Qin Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_7/A lamp inspired by the Cthulhu mythos and Starcraft_s Protoss aesthetics, 3d printed4MJ.png",
"folder_7/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring cyberpunk accents.DE.jpg",
"folder_7/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics.OJ.jpg",
"folder_7/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics.SD.jpg",
"folder_7/A lamp inspired by the Nurgle factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a transparent background, 3d printed2MJ.png",
"folder_7/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.DE(3).jpg",
"folder_7/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.SD(1).jpg",
"folder_7/A lamp inspired by the mixed aesthetics of Deus Ex and the armies in Ming Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_7/A lamp looks like pandaDE.jpg",
"folder_7/A lamp looks like pandaSD.jpg",
"folder_7/A lamp shaped like a cute snake made of smooth wood, Isometric view, Render style, abstractDE.jpg",
"folder_7/A lamp that looks like a panda_s face with black and white color schemeDE.jpg",
"folder_7/A lamp with a fluid, organic shape that hints at natural forms, Rendered with bold colors and sharp contrasts to create a striking visual effectDE.jpg",
"folder_7/A lamp with a minimalist design in soft colours and wood materials, with a lampshade made of see-through material, render styleSD.jpg",
"folder_7/A lamp with a minimalist design in soft colours, with a lampshade made of see-through material, render styleDE.jpg",
"folder_7/A lamp with a minimalist design in white and black colors, with a lampshade made of see-through material, render styleSD.jpg",
"folder_7/A lamp with a minimalist design that resembles an hourglass, The lamp has two different settings - one providing bright light for productivity, and the other providing a warm, soft glow for relaxation and creating a cozy atmosphere.SD.jpg",
"folder_7/A lamp with a multi-colored stained glass lampshade, elegant style, minimalistic colors, no bright colourDE.jpg",
"folder_7/A lamp with a multi-colored stained glass lampshade, elegant style, minimalistic colorsDE.jpg",
"folder_7/A lamp with a sci-fi-inspired design featuring a metallic finish and minimalist LED structure. The lamp_s sleek design should imply futuristic sophistication, with sharp angles and cutaways that suggest technological advancement.SD(2).jpg",
"folder_7/A lamp with a spider-like appearance, Inspired by Dyson designSD.jpg",
"folder_7/A lamp with a thin green stem and a bright pink tulip head that looks like it_s blossomingDE.jpg",
"folder_7/A lamp with a warm and cozy wooden-style appearance, incorporating a minimalist and modern concrete element to its design,solid background,render style --upbeta --v 543MJ.png",
"folder_7/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 54(1)4MJ.png",
"folder_7/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 543MJ.png",
"folder_7/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 54(2)4MJ.png",
"folder_7/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over timeOJ.jpg",
"folder_7/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over timeSD.jpg",
"folder_7/A modern bedside lamp with a geometric wooden base and a linen drum shade that casts a soft, warm glow, clear background, render styleOJ.jpg",
"folder_7/A sculptural lamp with an organic, flowing design, A minimalist lamp with geometric, angular features, A playful lamp with a whimsical, eye-catching appearanceDE.jpg",
"folder_7/A simple design that features a wooden base and a soft lighting sourceSD.jpg",
"folder_7/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(1)1MJ.png",
"folder_7/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(1)2MJ.png",
"folder_7/A sleek and polished lamp design with a web style touchOJ.jpg",
"folder_7/A steampunk-inspired lamp with a metallic, industrial base and a mason jar-inspired clear glass housingOJ.jpg",
"folder_7/A steampunk-inspired lamp with a metallic, industrial base and a mason jar-inspired clear glass housingSD.jpg",
"folder_7/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(3)3MJ.png",
"folder_7/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(3)4MJ.png",
"folder_7/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 543MJ.png",
"folder_7/An avant-garde lamp, with sinuous curves that can be delicately contorted towards the earth.SD.jpg",
"folder_7/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenityOJ.jpg",
"folder_7/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception.SD.jpg",
"folder_7/An oil-painted picture of an sleek and elegant lamp with subtle web-inspired detailsSD.jpg",
"folder_7/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 44(2)3MJ.png",
"folder_7/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 44(2)4MJ.png",
"folder_7/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 444MJ.png",
"folder_7/An oil-painting inspired lamp design with subtle web-inspired details, A lamp with an oil-painting style featuring delicate web elements, A lamp design inspired by oil-painting with elegant web-inspired accentsSD(1).jpg",
"folder_7/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 442MJ.png",
"folder_7/An oil-painting style, clear background, only a modern, elegant and sleek lamp design with web structures on the lamp shade --upbeta --v 444MJ.png",
"folder_7/An oil-painting style, elegant and sleek lamp design with subtle web-inspired details --upbeta --v 441MJ.png",
"folder_7/Art Deco inspired lamp with elegant curves and geometric shapes,_ _Streamlined body with silver accents in typical Art Deco fashion,_ _Angular, symmetrical lamp,  isometric viewpoint, full frontal view of the design, realistic._SD.jpg",
"folder_7/Clear image, Lamp_s shape, Lamp_s base color, Lamp_s dimensions, Lamp_s lighting properties, Lamp_s power sourceDE.jpg",
"folder_7/Copper lamp base - European-style lampshade, Glass crystal pendant, Hand-carved - Candle-like light bulborthographic front view,OJ.jpg",
"folder_7/Craft a unique lamp, inspired by the beautiful and organic form of a sea urchin, to add a touch of intrigue and natural elegance to your space --upbeta --v 443MJ.png",
"folder_7/Cthulhu-inspired lamp with a slimy ghost-like face and robotic accents.OJ.jpg",
"folder_7/Cthulhu-inspired, starwar, lamp with a slimy ghost-like face, isometric viewpoint.DE.jpg",
"folder_7/Design a lamp inspired by a jellyfish, with a translucent body, emitting a soft glowing lightDE.jpg",
"folder_7/Design a lamp inspired by the shape and structure of a tree, with a sleek and minimalistic design that mimics its branches and leaves. The lamp should use energy-efficient LED bulbs that give off a natural warm glow.SD.jpg",
"folder_7/Design a modern table lamp with clear glass lampshade and a metallic base. The lamp should have a warm white LED bulb and be approximately 18 inches highDE.jpg",
"folder_7/Design a modern table lamp with clear glass lampshade and a metallic base. The lamp should have a warm white LED bulb and be approximately 18 inches highSD.jpg",
"folder_7/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ(8).jpg",
"folder_7/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD(3).jpg",
"folder_7/Features include a dimmable LED light source that flickers like a real candleDE.jpg",
"folder_7/Features rounded shapes that can be placed in different parts of the student_s house for versatility, Has adjustable brightness and color temperature options for customization, Emits a soft and warm light to create a calm and soothing atmosphereOJ.jpg",
"folder_7/Futuristic 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint --upbeta --v 441MJ.png",
"folder_7/Futuristic 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint --upbeta --v 443MJ.png",
"folder_7/Geometric 3D lamp, Simple yet functional design, Monochromatic color palette, Minimalist aesthetic, Emphasis on form and structure, Use of 3D printing-friendly materialsDE.jpg",
"folder_7/Harry Potter lamp MJ.png",
"folder_7/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta --v 542MJ.png",
"folder_7/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, transparent background, isometric view --upbeta --v 543MJ.png",
"folder_7/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view --upbeta43MJ.png",
"folder_7/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view, multi-colour light --upbeta4(1)4MJ.png",
"folder_7/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.DE(2).jpg",
"folder_7/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.SD.jpg",
"folder_7/Make me a lamp that can make everyone else unhappy except me MJ.png",
"folder_7/Origami-inspired lamp design with neon lights and tube LEDs, using topology optimization to achieve a unique folded lamp structure3MJ.png",
"folder_7/QQ email address lamp, Wechat, Whatsapp, isometric view, 3d printable, app design --upbeta --v 542MJ.png",
"folder_7/Smooth and non-porous porcelain material for easy-to-clean maintenance,blue dimming light, steampunk, huge, dolphin-likeDE.jpg",
"folder_7/Sophisticated lamp featuring a simple yet elegant style.OJ.jpg",
"folder_7/Sophisticated lamp featuring a simple yet elegant style.SD.jpg",
"folder_7/The lamp_s base is designed to resemble a vintage candlestick holderSD.jpg",
"folder_7/Unibody 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint3MJ.png",
"folder_7/Warcraft-inspired lamp with a slimy ghost-like face and robotic accents.DE.jpg",
"folder_7/Warhammer-inspired lamp with a slimy ghost-like face and robotic accents.DE.jpg",
"folder_7/_A lamp with fluid lines, whose form can be gracefully curved towards the ground for a unique, contemporary look._OJ.jpg",
"folder_7/_Create a sleek and minimalistic 3D printable lamp with clean lines and a contemporary aesthetic.SD.jpg",
"folder_7/_Mushroom-inspired design, Frosted lampshade, Slim base, Soft glowDE.jpg",
"folder_7/_Mushroom-inspired design, Frosted lampshade, Slim base, Soft glowOJ.jpg",
"folder_7/_Streamlined 3D printable Art Deco lamp with geometric shapes and silver accents,_ _Castable lamp design with symmetrical angular body and vivid color scheme._OJ(1).jpg",
"folder_7/a apple lamp, cute, soft, warm light, tragicOJ.jpg",
"folder_7/a cute lamp(1).jpg",
"folder_7/a cute lamp(8).jpg",
"folder_7/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsDE(2).jpg",
"folder_7/a lamp design, 3d modelling render, game terraria, FULL LAMPDE.jpg",
"folder_7/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPDE(1).jpg",
"folder_7/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPDE.jpg",
"folder_7/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPOJ(1).jpg",
"folder_7/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --upbeta --v 542MJ.png",
"folder_7/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --v 54(1)4MJ.png",
"folder_7/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta --v 542MJ.png",
"folder_7/a lamp design, 3d modelling, apex legends guns, FULL LAMPSD.jpg",
"folder_7/a lamp design, 3d modelling, apex legends guns,DE(2).jpg",
"folder_7/a lamp design, 3d modelling, oxygen not included style, FULL LAMPOJ.jpg",
"folder_7/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 543MJ.png",
"folder_7/a lamp that has a laberinth that changes colour so children can play while parents are busy, with a rounded shape and water resistant43MJ.png",
"folder_7/a lamp with Lovecraft-style and Donald Trump4(2)1MJ.png",
"folder_7/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 54(2)1MJ.png",
"folder_7/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion.SD.jpg",
"folder_7/a portable lamp for outdoor activities MJ.png",
"folder_7/adjustable, lamp, playful, automatic, artistic, unique, orthographic view, 3D print --upbeta41MJ.png",
"folder_7/adjustable, lamp, playful, automatic, artistic, unique, orthographic view, 3D print --upbeta43MJ.png",
"folder_7/bike light that is charged with the energy of movementDE.jpg",
"folder_7/champion shirt lamp, big brand, LV, Gucci, Prada, isometric view, Chanel, 3d printable --upbeta42MJ.png",
"folder_7/contemporary violin-themed lamp with adjustable illumination and person playing it, make it futuristicOJ.jpg",
"folder_7/creepy fish-themed lamp with a modern twist and unique designDE.jpg",
"folder_7/cute robot-shaped lamp with touch screen in a futuristic setting, with a children interacting with itOJ.jpg",
"folder_7/cute robot-shaped lamp with touch screen in a futuristic settingSD.jpg",
"folder_7/disturbing vintage lamp design for terrifying movie settingSD.jpg",
"folder_7/elegant lampOJ.jpg",
"folder_7/female lamp with delft university of technology style on itDE.jpg",
"folder_7/frightening fish-inspired lamp for chilling atmosphere and modern appealOJ.jpg",
"folder_7/full male lampDE.jpg",
"folder_7/international, dutch, lamp,  sex, orthographic front view, exaggerated propotionsSD.jpg",
"folder_7/lamp attached to the headboard of the bed MJ.png",
"folder_7/lamp design blending the aesthetics of a modern stringed instrument with adjustable lighting elements for a sound and light experienceDE.jpg",
"folder_7/lamp design blending the aesthetics of a modern violin with adjustable lighting elements for a sound and light experience, in a context with it_s playerDE.jpg",
"folder_7/lamp design featuring a childish style and light colour tone, with multiple buttons, in a vintage style lamp design with a classic toy-inspired aesthetic and multiple colorful buttons for engaging interactionSD.jpg",
"folder_7/lamp design featuring a minimalist futuristic style and touch-sensitive controls embedded in the base for easy brightness adjustmentDE.jpg",
"folder_7/lamp design inspired by musical instruments combining sleek shapes with functional lighting elements, a lamp that could be used as an instrumentSD.jpg",
"folder_7/lamp design, cappuccino like, coffee, coconut, candy, beautiful, orthographic front view,SD.jpg",
"folder_7/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta --upbeta --v 544MJ.png",
"folder_7/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta4(2)2MJ.png",
"folder_7/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta42MJ.png",
"folder_7/lamp design, noodle, rice, dumpling, shit, cow, orthographic front view,SD(2).jpg",
"folder_7/lamp design,with wool wall material, black hole feeling, Christian style ,wooden glassesDE.jpg",
"folder_7/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a chinese dragon,full lamp view,SD.jpg",
"folder_7/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a chinese,full lamp view,DE.jpg",
"folder_7/lamp that helps blind people to sense light4(1)3MJ.png",
"folder_7/lamp that projects photos with a warm color that changes shape according to the memorySD.jpg",
"folder_7/lamp to decorate the room for dia de muertos42MJ.png",
"folder_7/lamp to decorate the room for dia de muertos44MJ.png",
"folder_7/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta4(1)4MJ.png",
"folder_7/lamp, Organic shapes, Earthy tones, Geometric patterns, Bohemian style, Vintage inspiration, Scandinavian design, Coastal vibes, Minimalist aesthetic.orthographic front viewSD(1).jpg",
"folder_7/male lamp with delft university of technology style on itOJ(1).jpg",
"folder_7/music player lamp, piano, accordion, low quality, isometric view, 3d printable --upbeta41MJ.png",
"folder_7/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfume --upbeta --v 54(1)1MJ.png",
"folder_7/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfume --upbeta --v 544MJ.png",
"folder_7/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfumeOJ.jpg",
"folder_7/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume --upbeta42MJ.png",
"folder_7/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta --v 54(1)4MJ.png",
"folder_7/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta --v 543MJ.png",
"folder_7/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta --v 544MJ.png",
"folder_7/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta4(1)1MJ.png",
"folder_7/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta44MJ.png",
"folder_7/playful lamp --upbeta --v 541MJ.png",
"folder_7/playful lamp --upbeta --v 543MJ.png",
"folder_7/playful lamp --upbeta --v 544MJ.png",
"folder_7/portable lamp for people that are scared of the darkDE.jpg",
"folder_7/round shape lamp, smooth surface without complex patterns --upbeta --v 44(1)1MJ.png",
"folder_7/round shape lamp, smooth surface without complex patterns --upbeta --v 44(1)2MJ.png",
"folder_7/round shape lamp, smooth surface without complex patterns --upbeta --v 44(1)3MJ.png",
"folder_7/round shape lamp, smooth surface without complex patterns --upbeta --v 442MJ.png",
"folder_7/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta4(2)1MJ.png",
"folder_7/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta44MJ.png",
"folder_7/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta4(1)2MJ.png",
"folder_7/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta4(2)1MJ.png",
"folder_7/whole-person inspired cute robotic lamp with touch screen and futuristic elementsSD.jpg",
"folder_8/1_a lamp showing vegan notion, vegan slogan, no meat, support vegan lifestyle MJ.png",
"folder_8/1_a lamp that cast light from a bald man_s head, shining bald head, no hear, funny, creepy MJ.png",
"folder_8/1_lamp design for a cat MJ.png",
"folder_8/1_lamp for a reading corner MJ.png",
"folder_8/2_1_1980s sci-fi style lamp MJ.png",
"folder_8/2_1_Harry Potter lamp MJ.png",
"folder_8/2_1_Make me a lamp that fells in love with another lamp but with a different gender MJ.png",
"folder_8/2_1_a lamp that is suitable for a indoor tennis court MJ.png",
"folder_8/3D printable disturbing vintage lamp for horror movie setting, render style, with fish elementsOJ.jpg",
"folder_8/3D printable lamp with single geometric shape, Utilizing 3D printing-friendly materials --upbeta --v 443MJ.png",
"folder_8/3D printable lamp, Gaudi, Curving shapes and lines, Whimsical and playful design elements, Inspired by natural forms and patterns, Mosaic tile embellishments, Use of bold and unique colors, Geometric shapes and patterns, lampSD.jpg",
"folder_8/3_2_1_a futuristic metal lamp that looks like something from a sci-fi movie MJ.png",
"folder_8/3_2_1_a portable lamp for outdoor activities MJ.png",
"folder_8/3_2_1_make me a heterosexual lamp MJ.png",
"folder_8/3_2_1_small size lamp for kindergarten playroom MJ.png",
"folder_8/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelSD(5).jpg",
"folder_8/3d printable lamp, aerodynamic streamline, symmetryDE(1).jpg",
"folder_8/3d printable lamp, art deco, hand sketchSD.jpg",
"folder_8/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright color that complements the stem, The lamp should be made with 3D-printable materials, render style, full lamp viewSD.jpg",
"folder_8/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright pink color that complements the stem, The lamp should be made with 3D-printable materialsDE.jpg",
"folder_8/A brightly colored tulip-shaped lamp with a slender stem, The flower should be a bright pink color that complements the stem, The lamp should be made with 3D-printable materialsOJ.jpg",
"folder_8/A coloful man-shaped shinning lamp design, orthographic front view,OJ.jpg",
"folder_8/A cute lamp made of wood, soft material in the shape of an animalDE.jpg",
"folder_8/A cute lamp shaped as a bunny made of smooth wood, eyes made of transparent plastic to resemble bunny_s eyesDE.jpg",
"folder_8/A cute lamp shaped as a bunny made of smooth wood, eyes made of transparent plastic to resemble bunny_s eyesSD.jpg",
"folder_8/A cute lamp shaped as a snake made of smooth wood, isometric view,render style --upbeta --v 544MJ.png",
"folder_8/A cute lamp shaped as a snake made of smooth wood, isometric view,render style, clear background --upbeta --v 541MJ.png",
"folder_8/A cute lamp shaped as a snake made of smooth wood, isometric viewOJ.jpg",
"folder_8/A lamp designed specifically for blind users that translates light intensity into vibration, The lamp also emits light for sighted users, but the vibration feature can be used independentlyDE.jpg",
"folder_8/A lamp designed to celebrate Día de Muertos with a unique and colorful aesthetic, Features different color emission options for variety in lighting, Has light sensitivity that reacts to sound or music to create a dynamic display for festive eventsOJ.jpg",
"folder_8/A lamp handmade from natural materials to create a rustic, earthy aesthetic. The lamp should be crafted from materials such as wood, stone, or natural fibers, and feature a design inspired by the organic shapes found in nature.DE(1).jpg",
"folder_8/A lamp handmade from natural materials to create a rustic, earthy aesthetic. The lamp should be crafted from materials such as wood, stone, or natural fibers, and feature a design inspired by the organic shapes found in nature.SD.jpg",
"folder_8/A lamp inspired by Dadaism and the aesthetic of the Qin Dynasty, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_8/A lamp inspired by Donald Trump, the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents.OJ.jpg",
"folder_8/A lamp inspired by TU Delft blue, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.SD.jpg",
"folder_8/A lamp inspired by TU Delft blue, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed2MJ.png",
"folder_8/A lamp inspired by Warhammer 40K aesthetics, isometric viewpoint, clear background, 3d printed4MJ.png",
"folder_8/A lamp inspired by civil engineering designs, incorporating industrial materials like steel and concrete, Featuring a streamlined, minimalist design with clean lines and simple shapesDE.jpg",
"folder_8/A lamp inspired by cyberpunk and the aesthetic of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background3MJ.png",
"folder_8/A lamp inspired by cyberpunk and the aesthetic of Deus Ex, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_8/A lamp inspired by the Cthulhu mythos and Starcraft aesthetics, 3d printed1MJ.png",
"folder_8/A lamp inspired by the Cthulhu mythos and Starcraft_s Protoss aesthetics, 3d printed3MJ.png",
"folder_8/A lamp inspired by the Cthulhu mythos and Starcraft_s Protoss aesthetics, clear background, 3d printed3MJ.png",
"folder_8/A lamp inspired by the Cthulhu mythos and Warhammer 40K aesthetics, 3d printed3MJ.png",
"folder_8/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.DE(1).jpg",
"folder_8/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed.OJ.jpg",
"folder_8/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring the idea of making America great again.OJ.jpg",
"folder_8/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.SD(4).jpg",
"folder_8/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed3MJ.png",
"folder_8/A lamp inspired by the aesthetics of Journey to the West, full front, render style, orthographic full view of the design from behind, and a solid color background4MJ.png",
"folder_8/A lamp inspired by the mixed aesthetics of Starcraft_s Terran and Protoss factions, full front, render style, orthographic full view of the design from behind, and a solid color background2MJ.png",
"folder_8/A lamp looks like pandaOJ.jpg",
"folder_8/A lamp looks weird and makes you feel in the oceanDE.jpg",
"folder_8/A lamp that stands at approximately 3 feet tall, with a flat circular base, The lamp emits a bright white light and can be dimmed to create a more subdued ambiance.SD.jpg",
"folder_8/A lamp with a geometrically shaped lampshade in black and white patterns, like pandaSD.jpg",
"folder_8/A lamp with a minimalist design in soft colors made from wood, lampshade made from see-through material, render styleOJ.jpg",
"folder_8/A lamp with a minimalist design in soft colors, with a lampshade made of see-through material, render styleDE.jpg",
"folder_8/A lamp with a minimalist design in soft colors, with a lampshade made of see-through material, render styleOJ.jpg",
"folder_8/A lamp with a minimalist design in soft colours and wood materials, with a lampshade made of see-through material, render styleDE.jpg",
"folder_8/A lamp with a minimalist design in white and black colors, with a lampshade made of see-through materialOJ.jpg",
"folder_8/A lamp with a multi-colored stained glass lampshadeDE.jpg",
"folder_8/A lamp with a multi-colored stained glass lampshadeOJ.jpg",
"folder_8/A lamp with a multi-colored stained glass lampshadeSD.jpg",
"folder_8/A lamp with a sci-fi-inspired design featuring a metallic finish and minimalist LED structure. The lamp_s sleek design should imply futuristic sophistication, with sharp angles and cutaways that suggest technological advancement.DE(2).jpg",
"folder_8/A lamp with a sci-fi-inspired design featuring a metallic finish and minimalist LED structure. The lamp_s sleek design should imply futuristic sophistication, with sharp angles and cutaways that suggest technological advancement.SD.jpg",
"folder_8/A lamp with a warm and cozy appearance perfect for a winter night, north Sweden, China red, universe repairment,Zen, budda, Taichi, shitOJ(1).jpg",
"folder_8/A lamp with a warm and cozy wooden-style appearance, incorporating a minimalist and modern concrete element to its design,solid background,render style --upbeta --v 542MJ.png",
"folder_8/A lamp with a whimsical and uplifting design, featuring a base made from inflated or molded balloons tied together to form a cluster or bouquetOJ.jpg",
"folder_8/A lamp with an irregular, organic shape, reminiscent of a sea creature, two lamps in the same image, render style,veganSD.jpg",
"folder_8/A lamp with an irregular, organic shape, reminiscent of a sea creature, two lamps in the same image, render styleDE.jpg",
"folder_8/A lamp with an irregular, organic shape, reminiscent of a sea creature, two lamps in the same image, render styleOJ.jpg",
"folder_8/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 54(1)1MJ.png",
"folder_8/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 54(2)4MJ.png",
"folder_8/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 544MJ.png",
"folder_8/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 54(2)2MJ.png",
"folder_8/A modern Apex-style shape with clean lines and bold angles, An inclusive design that accommodates all users, A lamp with an ever-changing appearance that shifts over time,solid white background,render style --upbeta --v 543MJ.png",
"folder_8/A modern desk lamp with a matte black wooden base and an exposed filament bulb that produces a warm, soft light perfect for readingDE.jpg",
"folder_8/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped top --upbeta --v 54(1)1MJ.png",
"folder_8/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped top --upbeta --v 54(1)4MJ.png",
"folder_8/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped top --upbeta --v 544MJ.png",
"folder_8/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(3)2MJ.png",
"folder_8/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 541MJ.png",
"folder_8/A sleek and polished lamp design with a sophisticated touchDE.jpg",
"folder_8/A sleek and polished lamp design with a web touchSD.jpg",
"folder_8/A steampunk-inspired lamp with a metallic, industrial base and a mason jar-inspired clear glass housingDE.jpg",
"folder_8/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render styl --upbeta --v 543MJ.png",
"folder_8/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(2)3MJ.png",
"folder_8/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(1)2MJ.png",
"folder_8/An inviting lamp with, featuring a unique and striking bottom view to provide visual interest, incorporating a minimalist and modern concrete element to its designOJ.jpg",
"folder_8/An ocean-inspired table lamp with a wavy blue glass base and a white fabric drum shade that evokes the calming waves of a peaceful seaDE.jpg",
"folder_8/An oil-painting inspired lamp design with subtle web-inspired details --upbeta --v 44(1)3MJ.png",
"folder_8/An oil-painting inspired lamp design with subtle web-inspired details, A lamp with an oil-painting style featuring delicate web elements, A lamp design inspired by oil-painting with elegant web-inspired accentsOJ.jpg",
"folder_8/An oil-painting style, clear background, no furniture, only an elegant and fancy lamp design with subtle web-inspired structures --upbeta --v 444MJ.png",
"folder_8/An oil-painting style, elegant and sleek lamp design with subtle web-inspired details --upbeta --v 444MJ.png",
"folder_8/Craft a unique lamp, inspired by the beautiful and organic form of a sea urchin, to add a touch of intrigue and natural elegance to your space --upbeta --v 442MJ.png",
"folder_8/Create a whimsical lamp design that resembles a mushroom, with a cap-shaped lampshade and a slim stem-like base. The lampshade should be made of frosted glass or eco-friendly plastic that glows softly, and the base can be made of wood or ceramic.OJ.jpg",
"folder_8/Create a whimsical lamp design that resembles a mushroom, with a cap-shaped lampshade and a slim stem-like base. The lampshade should be made of frosted glass or eco-friendly plastic that glows softly, and the base can be made of wood or ceramic.SD.jpg",
"folder_8/Cthulhu-inspired, cyberpunk, lamp with a slimy ghost-like face, isometric viewpoint, 3d printable.SD.jpg",
"folder_8/Cthulhu-inspired, cyberpunk, lamp with a slimy ghost-like face, isometric viewpoint.DE.jpg",
"folder_8/Cthulhu-inspired, dagon, lamp with a slimy ghost-like face, isometric viewpoint.SD.jpg",
"folder_8/Cthulhu-inspired, ghost shell, lamp with a slimy ghost-like face, isometric viewpoint.DE.jpg",
"folder_8/Design a beautiful biophilic lamp that incorporates natural elements and materials, such as a lampshade made of woven bamboo or rattan, and a base made of reclaimed driftwood or stone.SD.jpg",
"folder_8/Each tentacle of the lamp can be adjusted to direct light in different directions, A lampshade made of frosted glass that diffuses light for a soft, ambient glowSD.jpg",
"folder_8/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space --upbeta --v 442MJ.png",
"folder_8/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE(2).jpg",
"folder_8/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.DE(6).jpg",
"folder_8/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.OJ(4).jpg",
"folder_8/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD(4).jpg",
"folder_8/Features rounded shapes that can be placed in different parts of the student_s house for versatility, Has adjustable brightness and color temperature options for customization, Emits a soft and warm light to create a calm and soothing atmosphereDE.jpg",
"folder_8/Features rounded shapes that can be placed in different parts of the student_s house for versatility, Has adjustable brightness and color temperature options for customization, Emits a soft and warm light to create a calm and soothing atmosphereSD.jpg",
"folder_8/Futuristic and avant-garde, Unibody 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint1MJ.png",
"folder_8/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation,clear background, isometric view --upbeta43MJ.png",
"folder_8/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation,clear background, isometric view --upbeta44MJ.png",
"folder_8/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta4(1)3MJ.png",
"folder_8/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta4(2)2MJ.png",
"folder_8/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta4(2)4MJ.png",
"folder_8/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimization --upbeta42MJ.png",
"folder_8/Hongkong, neon light, cyberpunk, lamp design, topology optimisation, Zaha Hadid, tube led, led strip, transparent background, isometric view, multi-colour light --upbeta43MJ.png",
"folder_8/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.OJ(1).jpg",
"folder_8/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.SD(3).jpg",
"folder_8/Lamp, slimy ghost-like face with robotic accents.SD.jpg",
"folder_8/Lamp_s minimalist design, Use of sleek materials, Innovative lighting features, Smart technology integration, Unique color schemes, Energy-efficient power sourceDE.jpg",
"folder_8/Make me a lamp that looks like a lamp MJ.png",
"folder_8/Origami-inspired lamp design with neon lights and tube LEDs, using topology optimization to achieve a unique folded lamp structure1MJ.png",
"folder_8/Origami-inspired lamp design with neon lights and tube LEDs, using topology optimization to achieve a unique folded lamp structure4MJ.png",
"folder_8/QQ email address lamp, Wechat, Whatsapp, isometric view, 3d printable, app design --upbeta --v 544MJ.png",
"folder_8/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta --v 543MJ.png",
"folder_8/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta4(1)3MJ.png",
"folder_8/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta44MJ.png",
"folder_8/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated propotions --upbeta42MJ.png",
"folder_8/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated propotionsOJ.jpg",
"folder_8/Smooth and non-porous porcelain material for easy-to-clean maintenance, blue dimming light, lamp, steampunk, huge, shark-like, wooden feelingSD.jpg",
"folder_8/The lamp_s base is designed to resemble a vintage candlestick holderDE.jpg",
"folder_8/The lampshade has a 3D-printed image of a T-Rex or other dinosaur, A lamp with a base designed to look like a dinosaur leg or footprint, It features multiple color-changing settings, creating the effect of a colored glow inside the dinosaur figureSD.jpg",
"folder_8/The lampshade is designed to mimic the pattern of plant leaves, adding a fresh and calming ambiance to any spaceOJ.jpg",
"folder_8/Unibody 3D printable lamp with a minimalist Muji design style, a bold red cable, simple texture, dynamic render style, and isometric viewpoint1MJ.png",
"folder_8/Unibody 3D printable lamp with a minimalist Muji design style, bold texture, dynamic render style, and isometric viewpoint1MJ.png",
"folder_8/Warhammer-inspired lamp with a slimy ghost-like face and robotic accents.OJ.jpg",
"folder_8/_A minimalist lamp with a sleek, modular design that can be easily reconfigured to suit various settings and moods, as it delivers elegant, understated lightingSD(1).jpg",
"folder_8/_Create a sleek and minimalistic 3D printable lamp with clean lines and a contemporary aesthetic.OJ.jpg",
"folder_8/a cute lamp(5).jpg",
"folder_8/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lights, planetary engine in the film named the wandering earthSD(1).jpg",
"folder_8/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lights, planetary engine in the film named the wandering earthSD.jpg",
"folder_8/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsSD(1).jpg",
"folder_8/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lightsSD(2).jpg",
"folder_8/a lamp design, 3d modelling render, game terraria, FULL LAMPSD(1).jpg",
"folder_8/a lamp design, 3d modelling render, game terraria, clear background, FULL LAMPOJ(2).jpg",
"folder_8/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMP --upbeta41MJ.png",
"folder_8/a lamp design, 3d modelling, apex legends guns, FULL LAMPDE.jpg",
"folder_8/a lamp design, 3d modelling, apex legends guns,DE.jpg",
"folder_8/a lamp design, 3d modelling, apex legends guns,SD.jpg",
"folder_8/a lamp design, guitar like material with strings on it, combination with plants, a bluetooth speakerSD.jpg",
"folder_8/a lamp of seven man dancing on it, paper material, with a base, colorful, chinese style MJ.png",
"folder_8/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 54(1)3MJ.png",
"folder_8/a lamp that fits the Chinese Rabbit Year, with fluent lines, minimalist, a user-friendly interface, pure background, touchable --upbeta --v 54(2)3MJ.png",
"folder_8/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 54(1)1MJ.png",
"folder_8/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 54(2)2MJ.png",
"folder_8/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion.DE.jpg",
"folder_8/a lamp, guitar like material with strings on it, combine with plants, can be used like a bluetooth speakerSD.jpg",
"folder_8/contemporary violin-themed lamp with adjustable illumination and person playing it, make it futuristicDE.jpg",
"folder_8/contemporary violin-themed lamp with adjustable illumination and person playing it, make it futuristicSD.jpg",
"folder_8/cute robot-shaped lamp with touch screen in a futuristic setting, with human shape and big eyesDE.jpg",
"folder_8/cute robot-shaped lamp with touch screen in a futuristic settingDE.jpg",
"folder_8/disturbing vintage lamp design for terrifying movie settingOJ.jpg",
"folder_8/lamp design featuring a minimalist futuristic cyber-punk style and touch-sensitive controls embedded in the base for easy brightness adjustment%C3%AF%C2%BC_optimal light, home environment, with oil-painting textureOJ.jpg",
"folder_8/lamp design featuring a minimalist futuristic style and touch-sensitive controls embedded in the base for easy brightness adjustmentSD.jpg",
"folder_8/lamp design featuring a minimalist futuristic style and touch-sensitive controls embedded in the base for easy brightness adjustment%C3%AF%C2%BC_optimal light, home environmentDE.jpg",
"folder_8/lamp design with modern violin aesthetics and adjustable lighting for sound and light experience, with someone playing itDE.jpg",
"folder_8/lamp design, noodle, rice, dumpling, 3D printing, cow, orthographic front view --upbeta41MJ.png",
"folder_8/lamp featuring the ancient myths of Middle-earth, made with vibers materials, Designed to look like a snakeOJ.jpg",
"folder_8/lamp lamb lamb lamp lamp lamb lamb lamp hahahaOJ(2).jpg",
"folder_8/lamp that helps blind people to sense light4(1)2MJ.png",
"folder_8/lamp with a overworld style but with solid functionality, can be driven by people --upbeta4(1)1MJ.png",
"folder_8/lamp with blue color and red lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashDE(2).jpg",
"folder_8/lamp with blue color and red lights which glows like dark monster, but smiles like baby angel. Make it looks like FlashSD.jpg",
"folder_8/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta4(1)3MJ.png",
"folder_8/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta41MJ.png",
"folder_8/lamp, Minimalism, Visually striking, Streamlined design, Customization, Refined lighting, Space elevation. And the Chinese translationOJ.jpg",
"folder_8/lamp, guitar, vegan, city, designer, club --upbeta4(1)1MJ.png",
"folder_8/lamp, guitar, vegan, city, designer, club --upbeta4(1)4MJ.png",
"folder_8/lamp, guitar, vegan, city, designer, club --upbeta44MJ.png",
"folder_8/lamp,3D printing technology to bring this modern design to life, A lamp with a sleek, geometric shape and quirky, whimsical details, Creating a unique, eye-catching pieceSD.jpg",
"folder_8/male lamp with delft university of technology style on itDE.jpg",
"folder_8/male lamp with delft university of technology style on itOJ.jpg",
"folder_8/milk, lamp, cartoon, abstract, remote, female, computer, orthographic front view, exaggerated propotionsSD.jpg",
"folder_8/only lamp, A lamp design inspired by the unusual and dream-like settings often seen in David Lynch_s movies. The lamp has a mysterious, surreal appearance and can be adjusted to different angles, creating a unique and memorable atmosphereSD.jpg",
"folder_8/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfume --upbeta --v 54(1)4MJ.png",
"folder_8/portable lamp for people that are scared of the darkOJ.jpg",
"folder_8/small size lamp for kindergarten playroom MJ.png",
"folder_8/soft loud major moderate lamp, yellow white pink rainbow, isometric view, 3d printable --upbeta --v 541MJ.png",
"folder_8/soft loud major moderate lamp, yellow white pink rainbow, isometric view, 3d printable --upbeta --v 543MJ.png",
"folder_8/soft loud major moderate lamp, yellow white pink rainbow, isometric view, 3d printable --upbeta --v 544MJ.png",
"folder_8/soft loud major moderate lamp, yellow white pink rainbow, isometric view, 3d printable --upbeta43MJ.png",
"folder_8/soft loud major moderate lamp, yellow white pink rainbow, isometric view, 3d printable --upbeta44MJ.png",
"folder_8/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta4(1)1MJ.png",
"folder_8/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta4(2)3MJ.png",
"folder_8/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta --v 54(1)2MJ.png",
"folder_8/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta --v 54(1)3MJ.png",
"folder_8/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta4(1)4MJ.png",
"folder_8/total knee replacement lamp, noise, sonic ambiance, music therapy, isometric view, 3d printable --upbeta4(2)4MJ.png",
"folder_9/1_a Chinese-style lamp with fancy dragon-pattern embossment MJ.png",
"folder_9/1_make me a lamp that is a collective of human hands with eyes in the palm growing like a tree MJ.png",
"folder_9/2_1_a Chinese-style lamp with fancy dragon-pattern embossment MJ.png",
"folder_9/3D printable disturbing vintage lamp for horror movie setting, render style, modern lookingDE.jpg",
"folder_9/3d printable lamp, Eclectic mix of materials, Bold and asymmetrical shapes, Unconventional forms, High contrasting colors, Dynamic and expressive patternsSD.jpg",
"folder_9/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelDE(5).jpg",
"folder_9/3d printable lamp, Sleek and modern design with metallic materials, Streamlined shape and form, Use of reflective surfaces to create a high-end look, Monochromatic color scheme, Use of curved lines and shapes for a soft and subtle feelSD(4).jpg",
"folder_9/3d printable lamp, aerodynamic streamline, symmetry, sun lightOJ(1).jpg",
"folder_9/3d printable lamp, aerodynamic streamline, symmetry, sun lightSD.jpg",
"folder_9/3d printable lamp, streamline, symmetry, simple, Intricate filigree details, Baroque style embellishments, Floral motifs, Ornate curves and swirlsSD(1).jpg",
"folder_9/A cute lamp shaped as a snake made of smooth wood, isometric viewSD.jpg",
"folder_9/A lamp could be used as a candleOJ.jpg",
"folder_9/A lamp inspired by TU Delft blue, the Lovecraftian_Cthulhu mythos and Warcraft aesthetics, isometric viewpoint, 3d printed4MJ.png",
"folder_9/A lamp inspired by the Cthulhu mythos and Starcraft_s Protoss aesthetics, 3d printed1MJ.png",
"folder_9/A lamp inspired by the Cthulhu mythos and Warhammer 40K aesthetics, 3d printed1MJ.png",
"folder_9/A lamp inspired by the Lovecraftian_Cthulhu mythos and Warhammer aesthetics, featuring a slimy ghost-like face with robotic accents, Donald Trump.SD.jpg",
"folder_9/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.DE(1).jpg",
"folder_9/A lamp inspired by the Slaanesh factions in Warhammer 40K aesthetics, full front, render style, orthographic full view of the design from behind, and a solid color background, 3d printed.SD.jpg",
"folder_9/A lamp that resembles a furry animal or creature, It has a wireless charging feature for compatible devices, making it a multi-functional accessory for any furry friend lover., The lampshade is made from faux fur, creating a cozy and warm ambianceSD.jpg",
"folder_9/A lamp that seamlessly combines a sleek, geometric shape with quirky, whimsical details to create an eye-catching piece, A lamp with an innovative and quirky design that integrates playful elements to create a unique and whimsical pieceOJ.jpg",
"folder_9/A lamp with a geometrically shaped lampshade in black and white patternsOJ.jpg",
"folder_9/A lamp with a minimalist design that resembles an hourglass, The lamp has two different settings - one providing bright light for productivity, and the other providing a warm, soft glow for relaxation and creating a cozy atmosphere.OJ.jpg",
"folder_9/A lamp with a multi-colored stained glass lampshade, elegant style, minimalistic colors, no bright colourSD.jpg",
"folder_9/A lamp with clean lines and simple shapes, inspired by civil engineering designs, Featuring a polished, streamlined, and minimalist design --upbeta --v 54(1)2MJ.png",
"folder_9/A simple design that features a wooden base and a soft lighting sourceOJ(1).jpg",
"folder_9/A sleek and curvaceous lamp resembling a tulip with a long stem and bulb-shaped topDE.jpg",
"folder_9/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(3)3MJ.png",
"folder_9/A sleek and curvaceous tulip-shaped lamp with a long stem and bulb-shaped top, render style, solid colour background --upbeta --v 54(3)4MJ.png",
"folder_9/A steampunk-inspired lamp with a metallic, industrial base and a mason jar-inspired clear glass housing, The lampshade is designed to mimic the pattern of plant leaves, adding a fresh and calming ambiance to any spaceSD.jpg",
"folder_9/A transformer lamp with,incorporating a minimalist and modern concrete element to its design, inviting you to experience its warm and welcoming ambiance, and transform your space into a sanctuary,solid background, render style --upbeta --v 54(4)1MJ.png",
"folder_9/An elegant, Oriental-inspired lamp design, featuring intricate detailing reminiscent of traditional Chinese bamboo weaving, creating a warm, inviting atmosphere that evokes a sense of tranquility and serenitySD(2).jpg",
"folder_9/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception --upbeta4(1)1MJ.png",
"folder_9/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception.DE.jpg",
"folder_9/An enigmatic lamp that blurs the boundaries between fluid lines and sharp angles, with the ability to be manipulated to assume an intriguing form that defies perception.OJ.jpg",
"folder_9/An oil-painting of an sleek and elegant lamp with subtle web-inspired detailsSD(2).jpg",
"folder_9/Clear image, Lamp_s shape, Lamp_s base color, Lamp_s dimensions, Lamp_s lighting properties, Lamp_s power sourceSD.jpg",
"folder_9/Craft a unique lamp, inspired by the beautiful and organic form of a sea urchin, to add a touch of intrigue and natural elegance to your space --upbeta --v 441MJ.png",
"folder_9/Cthulhu-inspired, cyberpunk, lamp with a slimy ghost-like face, isometric viewpoint.OJ.jpg",
"folder_9/Cthulhu-inspired, starwar, lamp with a slimy ghost-like face, isometric viewpoint.SD.jpg",
"folder_9/Cylindrical-shaped lamp with a soft and fluffy wool fabric finishOJ.jpg",
"folder_9/Each tentacle of the lamp can be adjusted to direct light in different directions, A lampshade made of frosted glass that diffuses light for a soft, ambient glowOJ.jpg",
"folder_9/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD(2).jpg",
"folder_9/Embrace the purity and joy of the Arctic with a charming lamp inspired by the majestic polar bear, adding warmth and whimsy to your living space.SD(7).jpg",
"folder_9/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta41MJ.png",
"folder_9/Hongkong, neon light, cyberpunk, lamp design, metal, casting, topology optimisation, Zaha Hadid, clear background, isometric view --upbeta42MJ.png",
"folder_9/Inspired by the surreal world of David Lynchâ__s films, an eerie, mysterious lamp with an illusion-like appearance that can be shifted to various angles, creating a dreamlike atmosphere.OJ(3).jpg",
"folder_9/Make me a lamp that fells in love with another lamp but with a different gender MJ.png",
"folder_9/Minimalist teardrop-shaped lamp with a matte black finish, Multi-functional lamp with an extendable arm for reading and writingDE.jpg",
"folder_9/QQ email address lamp, Wechat, Whatsapp, isometric view, 3d printable, app design --upbeta41MJ.png",
"folder_9/Reading lamp, Dining room chandelier, automatic, bottle, orthographic front view, exaggerated proportions --upbeta43MJ.png",
"folder_9/Sleek lamp designDE.jpg",
"folder_9/Smooth and non-porous porcelain material for easy-to-clean maintenance,blue dimming light,lamp, steampunk, huge, dolphin-likeSD.jpg",
"folder_9/Whimsical design, Artistic structure, Color-changing lighting, Innovative mechanisms, Playful shapes, Interactive lighting, Abstract forms, Exaggerated proportions, Surreal style.OJ.jpg",
"folder_9/a cute lamp(2).jpg",
"folder_9/a futuristic metal lamp that looks like something from a sci-fi movie MJ.png",
"folder_9/a lamp design in sci-fi, isometric view, sketch style, with blue background, topology optimization and casting production, a future like lights, the film named the wandering earthSD.jpg",
"folder_9/a lamp design, 3d modelling render, game terraria, lego, clear background, FULL LAMPDE.jpg",
"folder_9/a lamp design, greek sculpture and geometricSD.jpg",
"folder_9/a lamp with Lovecraft-style and Donald Trump4(2)2MJ.png",
"folder_9/a lamp, concrete, wooden-style appearance, Tenon structure, warm and cozy, 2023 fashion, solid background, render style --upbeta --v 542MJ.png",
"folder_9/a lamp, guitar like material with strings on it, combination with plants, a bluetooth speakerOJ.jpg",
"folder_9/a lamp, guitar like material with strings on it, combine with plants, can be used like a bluetooth speakerDE.jpg",
"folder_9/adjustable, lamp, playful, automatic, artistic, unique, orthographic view, 3D print --upbeta44MJ.png",
"folder_9/adjustable, lamp, playful, automatic, artistic, unique,SD.jpg",
"folder_9/can you answer this question_ lampSD(1).jpg",
"folder_9/can you answer this question_ lampSD.jpg",
"folder_9/cute robot-shaped lamp with touch screen in a futuristic setting, with human shape and big eyesOJ.jpg",
"folder_9/disturbing vintage lamp design for terrifying movie settingDE.jpg",
"folder_9/flying dog lamp, jewellery, grammerly, chatgpt, isometric view, 3d printable --upbeta41MJ.png",
"folder_9/lamp design featuring a futuristic cyber-punk style and touch-sensitive controls embedded in the base for easy brightness adjustment%C3%AF%C2%BC__simulating human-shape, from top-viewOJ.jpg",
"folder_9/lamp design featuring a minimalist futuristic style and touch-sensitive controls embedded in the base for easy brightness adjustmentOJ.jpg",
"folder_9/lamp made of C60 materials, Inspired by the ancient myths of Middle-earth, designed to look like the WeChat logo from a top-view perspective,solid color background, render style --upbeta --v 544MJ.png",
"folder_9/lamp with dog feature but this looks like a machine, and have engine on it, iso metric view, 3d printable --upbeta42MJ.png",
"folder_9/lamp, guitar, vegan, city, designer, club --upbeta41MJ.png",
"folder_9/music player lamp, piano, accordion, low quality, isometric view, 3d printable --upbeta42MJ.png",
"folder_9/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfume --upbeta --v 542MJ.png",
"folder_9/orthographic front view, lamp design, glass , microsoft, tiktok, immersive, profile, perfumeDE.jpg",
"folder_9/portable lamp for people that are scared of the darkSD.jpg",
"folder_9/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta4(1)4MJ.png",
"folder_9/starlight lamp, broccoli feelings, car machine, isometric view, 3d printable --upbeta43MJ.png",
"folder_9/orthographic front view, lamp design, glass, Microsoft, TikTok, immersive, profile, perfume, 3d printed --upbeta --v 54(1)2MJ.png",
"folder_9/slender man lamp MJ.png"
];;
// data will not be saved

function run_nchoice_training(n_trials, imagesPerTrial) {
    return new Promise((resolve) => {
        
        const a_filepathprefix = "https://ik.imagekit.io/rndres1/dinou/";
        const modulePath = window.location.pathname.split('/')[1];
        const this_config = moduleConfig['desirability'];
        document.title = this_config.pagetitle;

        // replaces paranetheses, spaces and commas with underscores
        train_filenames = train_filenames.map(filename => {return filename.replace(/[\s,()]/g, "_");});
        
        const jsPsych = initJsPsych({
            show_progress_bar: false,
            on_finish: function () {
                resolve(ffp);
            },
        });
    
        
        var timeline = [];
    
        var instructions_trial = {
            type: jsPsychInstructions,
            pages: [
            `<h3> Introduction and Informed Consent </h3>
            <div class=".survey-questions-text">
            <p>
            You are being invited to participate in a research study titled “Generative AI and Tangible Products: Human-AI Design of 3D-printed lamps”. This study is being done by Dinuo LIAO from the TU Delft as a master's student.
            </p>`,

            `<div class=".survey-questions-text">
            <p> The study might take you around 25 minutes to complete. The data will be used for benchmarking different AI systems, for scientific publication, and for public communication.</p>
            <p> Note: There will be a few trials to check whether you are paying attention to the task.</p>
            `,
            
            `<div class=".survey-questions-text"> ${this_config.infotext} </div>`
          ],
            show_clickable_nav: true,
            allow_backward: true
        }
        timeline.push(instructions_trial);

            
        var pre_training_trial = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: "<h3>You will now be given some example trials.<br><br> Press enter to proceed.</h3>",  
        }
        timeline.push(pre_training_trial);


        stimObjects = train_filenames.map(parseFname);        
        for (eindx=0;eindx<n_trials;eindx++)
        {
            alltrials_this_emo = generateSamples(stimObjects, 1, imagesPerTrial);
            stim_thistrial = alltrials_this_emo[0];            
            var trial1 = {
                type: plugin_4choice, 
                stimuli: stim_thistrial,
                filepathprefix: a_filepathprefix,
                instruction: "",
                alignPrompt: this_config.alignPrompt
            }
            timeline.push(trial1);
            fnames = stim_thistrial.map(i => a_filepathprefix + i.filename);        
        }
        var post_training_trial = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: "<h3>You will now begin the main experiment.<br><br> Press enter to proceed.</h3>",
        }
        timeline.push(post_training_trial);
        

        var ffp = parseInt(jsPsych.data.getURLVariable('ffp'));
        console.log(ffp);
        if (isNaN(ffp) || ffp>5 || ffp<1)
        {
            ffp = Math.ceil(Math.random() * 5);
            console.log("Warning: invalid ffp. Using random value : " + ffp);
        }
        
        switch (ffp) {
            case 1:
                ffnames = all_filenames.slice(0, 336);
                break;
            case 2:
                ffnames = all_filenames.slice(336, 672);
                break;
            case 3:
                ffnames = all_filenames.slice(672, 1008);
                break;
            case 4:
                ffnames = all_filenames.slice(1008, 1344);
                break;
            case 5: 
                ffnames = all_filenames.slice(1344, 1680);
                break;
        }

        ffnames = ffnames.map(filename => {return filename.replace(/[\s,()]/g, "_");});
        ffnames = ffnames.concat(train_filenames);
        image_abs_paths = ffnames.map(i => a_filepathprefix + i);
        var preload = {
            type: jsPsychPreload,
            images: image_abs_paths, 
            max_load_time: 30000, // 30 seconds enough?
            continue_after_error: true, // continue with main experiment after timeout
            message: 'Please wait while images are loaded. This may take a few minutes. <br><br> Please <b> DO NOT </b> refresh the page.'
        };
        timeline.unshift(preload);
        jsPsych.run(timeline);
    
    }); // end of promise
    }// end of function;
function run_nchoice_experiment(n_trials, imagesPerTrial, ffp) {
    const jsPsych = initJsPsych({
        show_progress_bar: true,
    });

    var subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
    var study_id = jsPsych.data.getURLVariable('STUDY_ID');
    var session_id = jsPsych.data.getURLVariable('SESSION_ID');
    var internal_PID = String(Math.ceil(Math.random()*100000));

    const a_filepathprefix = "https://ik.imagekit.io/rndres1/dinou/";
    const modulePath = window.location.pathname.split('/')[1];
    const this_config = moduleConfig['desirability'];
    document.title = this_config.pagetitle;

    // no need to parse ffp, it is passed as parameter from training_nchoice
    switch (ffp) {
        case 1:
            files_used = all_filenames.slice(0, 336);
            break;
        case 2:
            files_used = all_filenames.slice(336, 672);
            break;
        case 3:
            files_used = all_filenames.slice(672, 1008);
            break;
        case 4:
            files_used = all_filenames.slice(1008, 1344);
            break;
        case 5: 
            files_used = all_filenames.slice(1344, 1680);
            break;
    }
    files_used = files_used.map(filename => {return filename.replace(/[\s,()]/g, "_");});
    console.log(files_used.length);
    
    const msg_attcheck = "choose the image on the top right";

    var demographic_q_trial = {
        type: jsPsychSurveyHtmlForm,
        preamble: '<div class="survey-questions-text"><p><h3>Tell us a bit about yourself</h3></p></div>',
        html: `<div class="survey-questions-text">
                <p>Age <input type="number" id="question1" name="demographic_input_age" size="4" /></p> 
                <p> Gender 
                <select name="demographic_input_gender">
                <option value=""></option>
                <option value="Male">Male</option> 
                <option value="Female">Female</option> 
                <option value="Other">Other</option> 
                </select>
                </p>
                <p> Highest educational qualification <select name="demographic_input_edu">
                <option value=""></option>
                <option value="highschool">High school</option> 
                <option value="grad">College degree or diploma</option> 
                <option value="postgrad">Postgraduate degree or higher</option> 
                </select>
                </p>
                <p> Nationality <input type="text" name="demographic_input_nationality"></p>
                </div>
                `,
        autofocus: 'question1',
        button_label: "Submit and Start Survey"
    };

    var data_save_trial = {
        type: jsPsychCallFunction,
        async: true,
        func: function(done){
        const messageDiv = document.createElement('div');
        messageDiv.id = 'workingMessage';
        messageDiv.class = "container";
        messageDiv.innerHTML = '<h2>Working. Please wait...</h2>';
        document.body.appendChild(messageDiv);
        senddata = {
            jspsych_data_all: jsPsych.data.get(),
            PROLIFIC_PID: subject_id,
            PROLIFIC_STUDY_ID: study_id,
            PROLIFIC_SESSION_ID: session_id,
            internal_PID: internal_PID,
            experiment_type: "4choice",
            ffp: ffp,
            experiment_dimension: modulePath // desirability, novelty etc.
        };
        senddata = JSON.stringify(senddata);
        var xhr = new XMLHttpRequest();
        ntl_URL = window.location.origin + "/.netlify/functions/savedata";
        xhr.open('POST', ntl_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
        if(xhr.status == 200){
            console.log("data saved to bucket, key " + xhr.responseText);
        } // if block ends            
        const messageDiv = document.getElementById('workingMessage');
        if (messageDiv) { messageDiv.remove(); }
        done(); // "invoking done() causes experiment to progress to next trial" ??
        };
        xhr.send(senddata);
        }  // end of anon function for jsPsychCallFunction
    };// end of trial object


    stimObjects = files_used.map(parseFname);
    trial_stimobjects = generateSamples(stimObjects, n_trials, imagesPerTrial);
    console.log(trial_stimobjects.length);

    timeline = [];
    for (trialIndx=0; trialIndx<n_trials; trialIndx++)
    {
        stim_thistrial = trial_stimobjects[trialIndx];
        var trial1 = {
            type: plugin_4choice, 
            stimuli: stim_thistrial,
            filepathprefix: a_filepathprefix,
            instruction: "",
            alignPrompt: this_config.alignPrompt
        }
        timeline.push(trial1);
    }   

    console.log("timeline created")

    acheck_stimObjects = generateSamples(stimObjects, 1, imagesPerTrial);
    var trial_attentionCheck = {
        type: plugin_4choice,
        stimuli: acheck_stimObjects[0],
        filepathprefix: a_filepathprefix,
        alignPrompt: msg_attcheck,
        instruction: "<i>this is an attention check</i>",
    };

    var psq_trial = {
        type: jsPsychSurveyHtmlForm,
        preamble: `
        <p>
            <h4> Almost done! </h4>
        </p>
        <p>
            <h4>
            Please rate your experience with the survey based on the following statements :
            </h4>
        </p>
        `,
        html: `
            <div class="survey-questions-text">
            <p> <label for="satisfaction">This survey was satisfying.</label></p>
            <p> <input type="range" id="satisfaction" name="psq_satisfaction" min="1" max="10" step="1"></p>
            
            <p> <label for="quality">This survey was of high quality.</label></p>
            <p> <input type="range" id="quality" name="psq_quality" min="1" max="10" step="1"></p>            
            
            <p> <label for="value">Completing this survey was of some value to me.</label></p>
            <p> <input type="range" id="value" name="psq_value" min="1" max="10" step="1"> </p>         
            
            <p> <label for="engaging">Completing this survey was engaging for me.</label></p>
            <p> <input type="range" id="engaging" name="psq_engaging" min="1" max="10" step="1"> </p>           
            
            <p> <label for="exhausting">Completing this survey was exhausting.</label></p>
            <p> <input type="range" id="exhausting" name="psq_exhausting" min="1" max="10" step="1"> </p>     
            
            <p><label for="worthwhile">Completing this survey was worthwhile.</label></p>
            <p><input type="range" id="worthwhile" name="psq_worthwhile" min="1" max="10" step="1"></p>
            
            <p><label for="fun">Completing this survey was fun.</label></p>
            <p> <input type="range" id="fun" name="psq_fun" min="1" max="10" step="1"> </p>          
            
            <p>
            <label for="comments">Any other feedback or comments about the survey?</label>
            </p>
            <textarea id="comments" name="psq_comments" rows="3" cols="80"></textarea>
            
            </div>
              `,
        button_label: "Submit",
        autocomplete: false,
        on_finish: function(data) {
            console.log("data saved");
            }
      };

      var final_trial = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `<h3>You have completed the survey. Thank you for participating!</h3>
          <p><b>IMPORTANT: </b><a href="https://app.prolific.co/submissions/complete?cc=CIU1JLTZ">Click here</a> to return to Prolific and receive your money.</p>`,
        choices: "NO_KEYS"
      };

    // shuffle the image displaying trials
    FYshuffle(timeline);
    
    timeline.unshift(demographic_q_trial);
    
    // data saving and attention checks at equally spaced locations
    insertElement(timeline, trial_attentionCheck, 4);
    insertElement(timeline, data_save_trial, 4);
    
    // at the end, show questionnaire, save data, and display thankyou message
    timeline.push(psq_trial);
    timeline.push(data_save_trial);
    timeline.push(final_trial);

    // everything loaded, BEGIN

    jsPsych.run(timeline);

};
