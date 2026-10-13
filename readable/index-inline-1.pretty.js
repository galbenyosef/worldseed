// three.js drives the first-person view; the globe and everything else work without it
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.186.1/three.module.min.js";
window.THREE = THREE;
window.dispatchEvent(new Event("three-ready"));
