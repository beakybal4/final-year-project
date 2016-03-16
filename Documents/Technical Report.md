


<br>

# Level Crossing Predictor

<br>

===


<center> <img src="../Assets/logo-only.png" width=500/> </center>

#### Josh Balfour <<jdb45@kent.ac.uk>>
#### Kieran Jones <<kj90@kent.ac.uk>>
#### Ryan Wood <<rsw24@kent.ac.uk>>

<br>


 
===



## Abstract

Level crossing closures are a cause of delay, have a negative impact on the environment due to fumes of stopped transport, and prevent vital emergency services from getting to their destination quickly. The problem is particularly noticeable in Canterbury, which has level crossings on main transport routes.


Can level crossing closures be predicted? Rail timetables plus real time train feeds might make journey planning through level crossings more reliable. Redirecting via longer, but quicker routes or delaying journeys would then be possible.


The project was to develop such a level crossing predictor, integrate with suitable mapping software on the web and/or mobile apps. Field testing for accuracy would be a key part of the final stages of the project.


The project was implemented in PHP and Node JS on the back end, using Angular JS on the front end and a MySQL Database, all managed in a Docker container.

## Introduction
```
This should outline the motivation for the project and sketch the general background. It might also signpost significant features of the rest of the report. Ideally, the introduction will both orient the reader and capture his/her interest.
```


## Background

```
No project is undertaken in isolation; rather, it builds upon earlier work and published material. In this section, you should provide a detailed account of this material, linking it in with the bibliography at the end of your report. The purpose is twofold: as a formal acknowledgement of prior work in the field, and as guidance to your reader should he or she be unfamiliar with the field.
```

* unofficial NROD wiki

## Aims

```
A careful statement of what it is that you are setting out to achieve.

(Several technical content sections)

This is where you go into detail about what you have done. You will need to decide the titles for these sections yourself; they will depend on the content of the project. These sections should summarize the technical and scientific achievements of the project.

Depending on the nature of your project, these sections may include: a comparison of different approaches that you considered, accounts of experimental work, mathematical analyses, specifications, top-level architectural diagrams, results obtained, problems encountered, workarounds, user evaluations, performance measures, testing regimes and results, comparisons between different approaches adopted, comparisons with existing work on similar problems.

In particular you should give a mixture of general discussion of your work and particular examples. Too much general discussion and the reader cannot easily get a handle on what you are doing; too many specific examples and the document fails to "tell a story".
```

### Step One - Plan

The project's requirements were first broken down to into 6 key points and numbered, in order of priority:

* R1 - Be able to show current level crossing times

* R2 - Be able to display level crossing times in a nice way

* R3 - Predict level crossing times to a 90% degree of accuracy within 2 minutes

* R4 - Have an open API to allow other developers to add value

* R5 - Be able to predict level crossing times to 95% degree of accuracy within 30 seconds

* R6 - Show more data about the level crossing that could be of potential interest (pictures, names, general information such as: accessibility, train frequency, and more)

Due to the size of the project, it was deemed appropriate to class the project as MVP, with a preceding Discovery phase and an extension "Future" phase.

The requirements were also allocated a 

We then broke each requirement down to a functional level, and listed out the functions that the the system would have to fullfill in order to accomplish each respective requirement, numbered in the format `Requirement#.Function#` for example R1 was broken down to 5 functional requirements:

* R1.F1 - Download and Store Level Crossing Locations

* R1.F2 - Download and Store Train Times

* R1.F3 - Download and Store Rail Station Locations (links R1.F1 and R1.F2)

* R1.F4 - Download and Store Railway Route Locations (R1.F1, R1.F2, and R1.F3)

* R1.F5 - Write algorithm to show if level crossing is up or down based on the above data

We then started a Spike, within which each function was discussed in depth and broken down to a task level, making notes from our own knowledge and researching where there were gaps, bullet points of what needed to be done in order to accomplish the task. This then allowed us to put man hour sizings against each task.

For Example R1.F1 was broken down into 3 tasks:

* R1.F1.T1 Set up a Database - 4 MH

	* DockerFile from mysql  

* R1.F1.T2 Find and download the data - 4 MH

	* Needs to be able to be done regularly, so must write script

		* Scrape [http://www.networkrail.co.uk/transparency/level-crossings/](http://www.networkrail.co.uk/transparency/level-crossings/)

		* Find download link

		* Download contents

		* Parse XLS file

		* Grab second sheet

		* Import each row into database table

* R1.F1.T3 Write view to sanitise/convert/extract the data we need - 1 MH

	* ID

	* location
	
With these Man Hour estimates in hand we were then able to make estimates by aggregating the estimates and including 10% contingency, as to how long each requirement was going to take to fulfill.

Aside from providing us with time estimates this process was incredibly valuable as it also highlighted the project's risks, which is why some tasks have ranges against them instead of an absolute hour value, and it also gave us time to think through the approach we would take, lowering the number of assumptions we made.

Taking these time estimates we then established how we would share the load of the tasks. 
To do this we needed to input the tasks into a collaborative project management tool, within which you could assign tasks to an individual, input dependancies, and generate gantt charts and workload reports.

After evaluating a number of different project management tools we ultimately chose Asana in combination with a collection other third party services, as it was both free and able to fulfill our needs.

Using the dynamic gantt chart creator Instagantt, we were able to pull our project data from Asana and render it in gantt chart form, like so:

<img src="Images/instagantt.png" width=650/>

NB: The bars were previously blue before the tasks were marked as completed.

During the discussions surrounding the Spike we had already established where the group member's strengths were and who already had a solid idea about how they would accomplish each task, so assigning responsibilities to group members was reasonably easy.

After allocating a team member to each task, we used the Pending Workload view in Instagantt to set target completion dates, preventing clashes and verifying that the workload was distributed evenly across team members.

<img src="Images/instagantt-workload.png" width=650/> 

NB: I marked tasks as incomplete so that they would show in the Pending Workload view to illustrate our usage of the product, hence they appear as red.

With the project planning process completed, we were able to deliver well thought through, concrete delivery date estimates to our project supervisor for when each requirement in the project would be met.


### Step Two - Execute

#### A Targeted Approach

Within the project plan a Discovery phase was allocated in order to establish the base of the project. 

This consisted of the following:

* A Version Control System.
* A self-contained runtime environment for development and deployment.
* A definition of practices surrounding documentation, testing, communication, and development.

The chosen VCS was GIT, as it met our requirements and would also allow us to use industry standard GitHub's free private hosted offering, which we were all very familiar with.

In order to ensure that software which our project would depend on was in sync between our development machines, and ultimately our production machine, we chose to use Docker to build a  low-overhead virtual machine, herein refered to as a container, which would have all our dependancies installed - our database, our application framework, and our web server. This container was defined by a script, known as a Dockerfile, which was under version control in our VCS (GitHub). 

Using Docker solved the issue of this project's environment conflicting with other projects on the developer's machines.
This also meant that when it came to test and deploy the application, we were able to do it in under a minute with no problems, as the environment was exactly the same as the development environment.


Using GitHub as our VCS allowed us to use GitHub's development workflow which they dubbed "GitHub Flow".

<img src="Images/the github flow.png" width=700/>

We implemented GitHub Flow by establishing in our development practice that when developing a feature, bugfix, or otherwise changing the contents of the repository, that the developer must first make a new branch from the master branch, perform their task, then open a Pull Request to the master branch. A notification is then sent to the rest of the team, who review the request, and when there is unanimous approval the code from the feature branch is merged into master, and the feature branch is deleted.

To minimise the opinionated aspect of our code review, the process was established objectively as part of our development practices. 
One of our criteria for approval was that the code could be automatically merged into the master branch, with no conflicts. This was determined by GitHub and could be satisfied by the developer who made the feature request merging the Master branch into their feature branch, and resolving any conflicts in their feature branch before making the pull request.
Another of our criteria was that the code passes all tests. In order to minimise the work required to verify this criteria we used a continuous integration service called Travis to continually monitor our code repository and run our automated tests. When a pull request was made against the master branch Travis would test both the feature branch, and the automatic merge from the feature branch into master branch.

The resulting box is then shown to reviewers of the pull request:

<img src="Images/pr-ci-tests.png" width=500/>

This approach minimised developer effort, whilst maximising stability of the product.

Discussions on pull requests were done using a team messaging service called Slack, which allowed us to communicate whilst on our laptops and phones. Our continuous integration service Travis, and our VCS GitHub integrated with Slack, which allowed developers to be notified when other team members were committing to the repository. This prompted increased collaboration and encouraged more knowledge sharing and allowed team members working remotely to feel more involved in the project.

```
*** Write about docs ***
```

#### Weekly Standups

Each week, as the project progressed and tasks were marked completed in Asana, the gantt chart automatically updated, visualising the project's progression. This allowed us to report to our project supervisor in graphical form the progress of the project.

Along with the updated gantt chart, a weekly report was produced using the third party service  WeekDone which pulled the project's progress data from Asana and generated a progress report, an excerpt of an example of which is below:

<img src="Images/productivity report.png" width=550/>

#### Pivot Points

Over the course of the project there were several pivot points, which, due to the agile approach we took, we were able to easily accomodate for.

##### Project Pivots

Data sourcing was one of our key challenges on this project, we pivoted many times before we settled on our final set of data sources.

In our initial research we found a website that mapped out the entire UK rail network on a Google Map, and emailed the author to obtain permission from him to use his data. Unfortunately he declined, so we kept searching.

We next looked into using crowd sourced mapping project Open Street Map's data. This however produced an extra set of challenges - mostly surrounding compute resources. This was because although the compressed map itself was only 4 GB, it was 40 GB uncompressed. The uncompressed file then needed to be imported into a Postgres database which had a geospatial extension called PostGIS installed. After evaluating this option it was deemed unfeasible due to the time it would take to extract the railway tracks from the database and the gamble taken on the quality of the resulting data, as it was purely a crowdsourced dataset.

After some in-depth research into the subject we found a government open spatial data initiative called INSPIRE. Backed by European Directive 2007/2/EC, the initiative established an infrastructure upon which government departments can publish geospatial datasets. Within the datasets published we found a listed, but not documented, API endpoint which was backed by Geoserver, an open source geospatial data server. Despite the lack of documentation, we were still able to make use of the API as one of the team mebers, Kieran, had knowledge of how Geoserver behaved so was able to write a reusable script to extract and transform the data we needed. Using this service we were able to source the railway track routes and the railway station locations.

##### Technology Pivots

* Lumen -> Laravel
* Postgres -> MySQL
* PHP -> HHVM
* PHP -> Node for algorithm
* Stack not compatible with Raptor, decided to use own server


Over the course of the project we made several pivots in the technology stack that we utilised to deliver this project.




#### Challenges



### Step Three - Deliver


## Conclusions

```
A statement of what your project achieved. For example you might want to consider:

* how well did your end-product work?
* how does it compare with other, similar projects?
* how novel are your ideas?
* what guidance can you offer to others setting out with similar aims?
* what scope is there for further work on the topic?
```

Key pain points:

* Data processing and curation as we overestimated the quality of relavent data available.
* Spending more time waiting than coding due to lack computing power.
* Setting our practices for project management from scratch due to not previously being taught project management procedures, systems or tools.
* Horrendous amount of Scope creep


Key success points:

* Automated continuous integration and code quality testing.
* The web app part of it just worked and was quick to develop.
* The prediction aspect of the project was easy.
* Data acquisition was relatively easy once found.

If we were to run this project again we would

* Write it entirely in Javascript.
* Split out our Docker containers as per industry best practices.
* Use Oracle DB for the data processing aspect of the project.



##Acknowledgements

```
Where you thank people who helped you or gave guidance (including your supervisor!).
```

## Bibliography

```
A list of work that you have referred to throughout the document, for example related projects and papers, reference documents, relevant textbooks, et cetera.

Some of the references may be of URLs to free-standing, electronically published reports but the majority are likely to be to textbooks or journal articles. Have a look at an academic paper such as the one below to see the style in which references to published work are presented. There are automated systems such as Endnote and BibTeX which can help you manage references automatically.
```

## Appendices

```
You might include items such as: test data, detailed results, significant portions of programs, statistical analyses, UML diagrams, etc. that, whilst not essential to understanding the main report, provide fine-grained info supporting conclusions reached or explaining methods adopted.

Appendices do not could towards the page limit. But do not use this as an excuse to "bulk up" the project in the mistaken belief that the heavier the project report the higher the mark! Indeed you will be marked down for excessive appendices which contain information which would be better included on the CD-ROM.

You should give careful thought to which items you want to include here, and which are better included on the accompanying CD-ROM. Written documents, detailed diagrams and tables are often better presented on paper. Items which will only be read briefly (like minutes of meetings) and items which contain large amounts of data (e.g. large sets of testing results) are better placed on the CD-ROM.
```