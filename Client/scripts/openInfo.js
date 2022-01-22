function openArtInfo(name) {
    DOM.art.header.innerText = ART[name].header;
    DOM.art.text.innerText = ART[name].text;
    DOM.art.window.style = "display: initial;";
    DOM.art.active = true;
}

function closeArtInfo() {
    if (DOM.art.active) {
        DOM.art.window.style = "display: none;";
        DOM.art.active = false;
    }
}

var nameOfImgUpload = null;

function openUploadImg(name) {
    nameOfImgUpload = name;
    DOM.uploadImg.window.style = "display: initial;";
    DOM.uploadImg.active = true;
}

function closeUploadImg() {
    if (DOM.uploadImg.active) {
        nameOfImgUpload = null;
        DOM.uploadImg.window.style = "display: none;";
        DOM.uploadImg.active = false;
    }
}

DOM.uploadImg.fileupload.addEventListener('change', handleImage, false);

function createPicture(position) {
    var board = new RD.SceneNode();
    board.name = "board";
    board.mesh = "plane";
    board.flags.two_sided = true;
    board.color = [0.7,0.7,0.7,1];
    board.textures.color = "canvas_texture";
    board.position = position;
    board.scale(4.8);
    return board;
}
function handleImage(e){
    var reader = new FileReader();
    reader.onload = function(event){
        var img = new Image();
        img.onload = function(){
            // create canvas
            var template = DOM.uploadImg.template;
            var sampleCanvas = template.cloneNode(true);
            sampleCanvas.width = img.width;
            sampleCanvas.height = img.height;
            var sample_ctx = sampleCanvas.getContext("2d");
            sample_ctx.drawImage(img,0,0);

            var tex_canvas = GL.Texture.fromImage( sampleCanvas );
            gl.textures["canvas_texture"] = tex_canvas;
            // create scene node
            var board = createPicture(UPLOAD[nameOfImgUpload].position);
            world.red.scene.root.addChild( board );

            // draw preview
            DOM.uploadImg.uploadCanvas.width = img.width;
            DOM.uploadImg.uploadCanvas.height = img.height;
            var ctx_preview = DOM.uploadImg.uploadCanvas.getContext("2d");
            ctx_preview.drawImage(img,0,0);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);     
}

var UPLOAD = {
    c2d1: {
        position: [10, 6.3, 14.8],
        rotation: []
    },
    c2d2: {
        position: [-10, 6.3, 14.8],
        rotation: []
    },
};

var ART = {
    mars: {
        text: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System, being larger than only Mercury. In English, Mars carries the name of the Roman god of war and is often referred to as the 'Red Planet'.",
        header: "Mars"
    },
    moon: {
        text: "Earth's Moon is the only place beyond Earth where humans have set foot.\nThe brightest and largest object in our night sky, the Moon makes Earth a more livable planet by moderating our home planet's wobble on its axis, leading to a relatively stable climate. It also causes tides, creating a rhythm that has guided humans for thousands of years. The Moon was likely formed after a Mars-sized body collided with Earth.",
        header: "Moon"
    },
    order: {
        text: "In our Solar System, there are eight planets. The planets in order from the Sun based on their distance are Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. The planets of our Solar System are listed based on their distance from the Sun. There are, of course, the dwarf planets Ceres, Pluto, Haumea, Makemake, and Eris; however, they are in a different class.\nAmong the dwarf planets, Pluto was listed as a planet the longest. This all changed in 2006 when the Astronomical Union - IAU - finally decided on the definition of a planet. According to the definition, a planet is a celestial body that is in orbit around the Sun, has enough mass to assume hydrostatic equilibrium - resulting in a round shape, and has cleared the neighborhood around its orbit.",
        header: "Order of the Planets"
    },
    milkyway: {
        text: "The Milky Way is the galaxy that contains our Solar System, with the name describing the galaxy's appearance from Earth: a hazy band of light seen in the night sky formed from stars that cannot be individually distinguished by the naked eye. The term Milky Way is a translation of the Latin via lactea, from the Greek galaktikos kyklos ('milky circle').\nFrom Earth, the Milky Way appears as a band because its disk-shaped structure is viewed from within. Galileo Galilei first resolved the band of light into individual stars with his telescope in 1610. Until the early 1920s, most astronomers thought that the Milky Way contained all the stars in the Universe. Following the 1920 Great Debate between the astronomers Harlow Shapley and Heber Curtis, observations by Edwin Hubble showed that the Milky Way is just one of many galaxies.",
        header: "The Milky Way"
    },
    earth: {
        text: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 29% of Earth's surface is land consisting of continents and islands. The remaining 71% is covered with water, mostly by oceans, seas, gulfs, and other salt water bodies, but also by lakes, rivers, and other fresh water, which together constitute the hydrosphere. Much of Earth's polar regions are covered in ice. Earth's outer layer is divided into several rigid tectonic plates that migrate across the surface over many millions of years. Earth's interior remains active with a solid iron inner core, a liquid outer core that generates Earth's magnetic field, and a convecting mantle that drives plate tectonics. ",
        header: "Earth"
    },
    sun: {
        text: "The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating the energy mainly as visible light and infrared radiation. It is by far the most important source of energy for life on Earth. Its diameter is about 1.39 million kilometres (864,000 miles), or 109 times that of Earth. Its mass is about 330,000 times that of Earth, and accounts for about 99.86% of the total mass of the Solar System.\nRoughly three quarters of the Sun's mass consists of hydrogen (~73%); the rest is mostly helium (~25%), with much smaller quantities of heavier elements, including oxygen, carbon, neon, and iron.",
        header: "Sun"
    },
    // alpine
    pragser: {
        text: "The Pragser Wildsee, or Lake Prags, Lake Braies (Italian: Lago di Braies; German: Pragser Wildsee) is a lake in the Prags Dolomites in South Tyrol, Italy. It belongs to the municipality of Prags which is located in the Prags Valley.\n\nPhotography by J.F.",
        header: "Lake Braies/Prags"
    },
    gams: {
        text: "The chamois (Rupicapra rupicapra) is a species of goat-antelope native to mountains in Europe, from west to east, including the Cantabrian mountains, the Pyrenees, the Alps and the Apennines, the Dinarides, the Tatra and the Carpathian Mountains, the Balkan Mountains, the Rila - Rhodope massif, Pindus, the northeastern mountains of Turkey, and the Caucasus. The chamois has also been introduced to the South Island of New Zealand. Some subspecies of chamois are strictly protected in the EU under the European Habitats Directive.\n\nPhotography by J.F.",
        header: "Mountain chamois"
    },
    barmsee: {
        text: "Barmsee is a lake in Oberbayern, Bavaria, Germany. At an elevation of 885.03 m, its surface area is 55 hectares.\n\nPhotography by J.F.",
        header: "Lake Barm"
    },
    wall: {
        text: "The Wallberg has made history as the starting point for large distance flights of paragliders and hang-gliders. The Wallberg toboggan run is Germany's longest winter toboggan run. The Wallberg race on the Wallbergstrasse, one of the best-known automobile mountain races in the 1960s, has not been held for some time for ecological reasons.\n\nPhotography by J.F.",
        header: "Wallberg"
    },
    kuh: {
        text: "Photography by J.F.",
        header: "Cow"
    },
    blau: {
        text: "The Blauberge ('Blue Mountains') or Blauberg are a mountain range in the Bavarian Prealps on the border between the states of Bavaria in Germany and Tyrol in Austria. Its highest summit is the Halserspitze, or Halserspitz at 1,862 m.\n\nPhotography by J.F.",
        header: "Blue mountains"
    },
    // modern art
    monet: {
        text: "Oscar-Claude Monet (14 November 1840 - 5 December 1926) was a French painter, a founder of French Impressionist painting and the most consistent and prolific practitioner of the movement's philosophy of expressing one's perceptions before nature, especially as applied to plein air landscape painting. The term 'Impressionism' is derived from the title of his painting Impression, soleil levant (Impression, Sunrise), which was exhibited in 1874 in the first Salon des Refuses (exhibition of rejects) mounted by Monet and his associates as an alternative to the Salon de Paris.",
        header: "Claude Monet"
    },
    picasso: {
        text: "Pablo Ruiz Picasso (25 October 1881 - 8 April 1973) was a Spanish painter, sculptor, printmaker, ceramicist and theatre designer who spent most of his adult life in France. Regarded as one of the most influential artists of the 20th century, he is known for co-founding the Cubist movement, the invention of constructed sculpture, the co-invention of collage, and for the wide variety of styles that he helped develop and explore. Among his most famous works are the proto-Cubist Les Demoiselles d'Avignon (1907), and Guernica (1937), a dramatic portrayal of the bombing of Guernica by German and Italian air forces during the Spanish Civil War. ",
        header: "Pablo Picasso"
    },
    dali: {
        text: "Salvador Domingo Felipe Jacinto Dali i Domenech, 1st Marquess of Dali de Pubol (11 May 1904 - 23 January 1989) was a Spanish surrealist artist renowned for his technical skill, precise draftsmanship and the striking and bizarre images in his work.\nBorn in Figueres, Catalonia, Dali received his formal education in fine arts in Madrid. Influenced by Impressionism and the Renaissance masters from a young age, he became increasingly attracted to Cubism and avant-garde movements. He moved closer to Surrealism in the late 1920s and joined the Surrealist group in 1929, soon becoming one of its leading exponents. His best-known work, The Persistence of Memory, was completed in August 1931, and is one of the most famous Surrealist paintings. Dali lived in France throughout the Spanish Civil War (1936 to 1939) before leaving for the United States in 1940 where he achieved commercial success. He returned to Spain in 1948 where he announced his return to the Catholic faith and developed his 'nuclear mysticism' style, based on his interest in classicism, mysticism and recent scientific developments",
        header: "Salvador Dali"
    },
    klimt: {
        text: "Gustav Klimt (July 14, 1862 - February 6, 1918) was an Austrian symbolist painter and one of the most prominent members of the Vienna Secession movement. Klimt is noted for his paintings, murals, sketches, and other objects d'art. Klimt's primary subject was the female body, and his works are marked by a frank eroticism. Amongst his figurative works, which include allegories and portraits, he painted landscapes. Among the artists of the Vienna Secession, Klimt was the most influenced by Japanese art and its methods.",
        header: "Gustav Klimt"
    },
    richter: {
        text: "Gerhard Richter (born 9 February 1932) is a German visual artist. Richter has produced abstract as well as photorealistic paintings, and also photographs and glass pieces. He is widely regarded as one of the most important contemporary German artists and several of his works have set record prices at auction.",
        header: "Gerhard Richter"
    },
    gogh: {
        text: "Vincent Willem van Gogh (30 March 1853 - 29 July 1890) was a Dutch post-impressionist painter who posthumously became one of the most famous and influential figures in the history of Western art. In a decade, he created about 2,100 artworks, including around 860 oil paintings, most of which date from the last two years of his life. They include landscapes, still lifes, portraits and self-portraits, and are characterised by bold colours and dramatic, impulsive and expressive brushwork that contributed to the foundations of modern art. He was not commercially successful, and his suicide at 37 came after years of mental illness, depression and poverty. ",
        header: "Vincent van Gogh"
    },
};