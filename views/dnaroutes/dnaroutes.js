window.DNARoutesView = class DNARoutesView extends View {
    static APP_ID = "Calendar";
    
    static people = new Map();
    static cc7MinPrivateId = 0;

    other_person = "";
    our_id = "";
    static cont_sel = "";

    static roots = [];

    constructor() {
        super();
        console.log("CTOR");
    }

    meta() {
        return {
            title: "DNA Routes",
            description: "A simple example app.",
        };
    }

    static addPeople(profiles) {
        let nrAdded = 0;
        let alreadyExisting = 0;
        let oldestBirth = 9999;
        for (const person of profiles) {
            //What does the + do?
            let id = +person.Id;
            if (id < 0) {
                if (DNARoutesView.people.has(id)) {
                    id = window.cc7MinPrivateId - 1;
                }
                person.Id = id;
                person.Name = `Private${id}`;
                person.DataStatus = { Spouse: "", Gender: "" };
            }
            if (!DNARoutesView.people.has(id)) {
                if (id < 0) {
                    window.cc7MinPrivateId = Math.min(id, window.cc7MinPrivateId);
                }
                person.Parents = [person.Father, person.Mother];
                
                ++nrAdded;

                let year = parseInt(person.BirthDateDecade.replace("s", ""), 10);
                if(oldestBirth > year) {
                    oldestBirth = year;
                }
                DNARoutesView.people.set(id, person);
            } else {
                alreadyExisting++;
                console.log(`Already added ${id}`);
            }
        }
        console.log(`Added ${nrAdded}`);

        let work = new Set();
        let added_work = 0;
        for(const [k, p] of DNARoutesView.people) {
            //console.log(`Checking ${p.Id} ${p.Parents}`);
            if((p.Parents[0] != 0 && !DNARoutesView.people.has(p.Parents[0])) || (p.Parents[1] != 0 && !DNARoutesView.people.has(p.Parents[1]))) {
                added_work++;
                work.add(p.Id);
                console.log(`Work: ${p}`);
            }
        }
        const $ = document.querySelector.bind(document);

        if ($('div#unfinished')) {
            $('div#unfinished').innerText = added_work.toString();
        } else {
            console.log("No unfinished");
        }
        if ($('div#total-persons')) {
            $('div#total-persons').innerText = DNARoutesView.people.size.toString();
        }
        if ($('div#oldest-birth')) {
            $('div#oldest-birth').innerText = oldestBirth.toString();
        }
        if ($('div#duped')) {
            $('div#duped').innerText = alreadyExisting.toString();
        }
        console.log(`New work left to do: ${work.size} and added ${added_work}`);

        console.log(`Other is: ${this.other_person}`);
        console.log(`Our_ID is: ${this.our_id}`);
        console.log(this.cont_sel);
        if(this.other_person) {
            //Yeah, we can do shit!
            document.querySelector(DNARoutesView.cont_sel).innerText = `Ok, path between ${this.person_id} and ${this.other_person}`;
        }
        document.querySelector(DNARoutesView.cont_sel).innerText = this.roots.toString();

    }

    async init(container_selector, person_id) {
        this.our_id = person_id;
        DNARoutesView.cont_sel = container_selector;
        console.log("§§§§§§§§§§§§§§§§§§§§§ INIT §§§§§§§§§§§§§§§§§§");
        const personData = await WikiTreeAPI.getPerson(DNARoutesView.APP_ID, person_id, ["FirstName"]);
        console.log(personData);
        const name = personData["_data"]["FirstName"];
        document.querySelector(container_selector).innerText = `Hello, ${name}`;

        if ($('#main-status').length) {
            $('#main-status').remove();
        }

        const displayOptionsHTML = `
        <div style="display:flex;flex-wrap:none" id="main-status">
        <div id="view-options">
            <label for="our-go">Other relative:</label>
            <input type="text" id="other_person">
            <input type="submit" id="our-go" value="GO">
        </div>
        <div style="display:flex" id="summary-info">
            Profiles total: <div id="total-persons">N/A</div>&nbsp;
            Profiles duped: <div id="duped">N/A</div>&nbsp;
            Profiles not finished: <div id="unfinished">N/A</div>&nbsp;
            Oldest birthdate: <div id="oldest-birth">N/A</div>&nbsp;
        </div>
        </div>
        `;

        $('main').append(displayOptionsHTML);

        this.getProfiles(person_id);

        $('#our-go').on('click', () => {
            const $ = document.querySelector.bind(document);
            let personId = $('input#other_person').value;
            console.log(personId);
            this.getProfiles(personId);
            this.other_person = personId;
            console.log(`Set other: ${this.other_person}`);
            DNARoutesView.roots.push(personId);

            //document.querySelector(container_selector).innerText = `Hello, ${this.roots}`;
        });
    }

    async getProfiles(person_id) {
        DNARoutesView.cancelLoadController = new AbortController();

        const starttime = performance.now();
        try {
            const result = await WikiTreeAPI.postToAPI(
                {
                    appId: DNARoutesView.APP_ID,
                    action: "getPeople",
                    keys: person_id,
                    nuclear: 0,
                    minGeneration: 0,
                    ancestors: 10,
                    start: 0,
                    limit: 1001,
                    fields: "Id,Name,FirstName,LastNameAtBirth,BirthDateDecade,DeathDateDecade,Father,Mother",
                },
                DNARoutesView.cancelLoadController.signal
            );
            console.log(
                `Retrieved profiles at degrees ${
                    performance.now() - starttime
                }ms`);

                console.log(result[0].status);
                console.log(result[0].people);
                console.log(Object.values(result[0].people).length);
                DNARoutesView.addPeople(Object.values(result[0].people));
        } catch(error) {
            console.warn(`Error: ${error}`);
        }

    }
};
